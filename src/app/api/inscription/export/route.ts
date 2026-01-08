import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { PRODUCT_SIZES_CM } from '@/content/inscription';
import { execute } from '@/lib/db';
import { ensureDir, writeFileSafe } from '@/lib/files';
import { isSafePathSegment, normalizeHexColor, optionalText, requireText } from '@/lib/validation';

export const runtime = 'nodejs';

function safeSegment(input: string) {
  const cleaned = input.replace(/[^\w-]/g, '').slice(0, 64);
  return cleaned || `sess-${crypto.randomBytes(4).toString('hex')}`;
}

const MAX_EXPORT_CHARS = 2_000_000;
const MAX_DETAILS_CHARS = 200_000;
const MAX_VIEW_EXPORTS = 8;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const sessionIdRaw = String(payload.sessionId ?? '');
    const projectId = String(payload.projectId ?? '');
    const product = String(payload.product ?? '');
    const sizeCm = Number(payload.sizeCm ?? 0) || 0;
    const fontIdRaw = payload.fontId;
    const fontIdNum = Number(fontIdRaw);
    const fontId = Number.isFinite(fontIdNum) && fontIdNum > 0 ? Math.trunc(fontIdNum) : null;
    const fontName = requireText(String(payload.fontName ?? ''), 190);
    const color = normalizeHexColor(String(payload.color ?? ''));
    const svg = String(payload.svg ?? '');
    const dxf = String(payload.dxf ?? '');
    const clientName = optionalText(String(payload.clientName ?? ''), 190);
    const clientContact = optionalText(String(payload.clientContact ?? ''), 190);
    const detailsRaw = payload.details ?? null;
    const detailsJson = detailsRaw ? JSON.stringify(detailsRaw) : '';
    const viewExportsRaw = Array.isArray(payload.viewExports) ? payload.viewExports : [];
    const viewExports: Array<{ view: string; svg: string; dxf: string }> = [];
    const primaryViewRaw = String(payload.primaryView ?? '');

    if (!sessionIdRaw || !projectId || !product || !sizeCm || !svg || !dxf || !fontName || !color) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (clientName === null || clientContact === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (viewExportsRaw.length > MAX_VIEW_EXPORTS) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let primaryView = '';
    if (primaryViewRaw) {
      if (!isSafePathSegment(primaryViewRaw, 40)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
      primaryView = primaryViewRaw;
    }

    let viewChars = 0;
    for (const entry of viewExportsRaw) {
      const view = String(entry?.view ?? '');
      const viewSvg = String(entry?.svg ?? '');
      const viewDxf = String(entry?.dxf ?? '');
      if (!view || !viewSvg || !viewDxf) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
      if (!isSafePathSegment(view, 40)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
      if (viewSvg.length > MAX_EXPORT_CHARS || viewDxf.length > MAX_EXPORT_CHARS) {
        return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
      }
      viewChars += viewSvg.length + viewDxf.length;
      if (viewChars > MAX_EXPORT_CHARS * MAX_VIEW_EXPORTS) {
        return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
      }
      viewExports.push({ view, svg: viewSvg, dxf: viewDxf });
    }

    if (!isSafePathSegment(projectId, 80)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!Object.prototype.hasOwnProperty.call(PRODUCT_SIZES_CM, product)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!PRODUCT_SIZES_CM[product as keyof typeof PRODUCT_SIZES_CM].includes(sizeCm)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (svg.length > MAX_EXPORT_CHARS || dxf.length > MAX_EXPORT_CHARS) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    if (detailsJson.length > MAX_DETAILS_CHARS) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const sessionId = safeSegment(sessionIdRaw);
    const exportId = crypto.randomBytes(10).toString('hex');
    const usePrimaryView = Boolean(
      primaryView && viewExports.some((entry) => entry.view === primaryView),
    );

    const dir = path.join(process.cwd(), 'storage', 'exports', sessionId);
    await ensureDir(dir);

    const primaryFileTag = usePrimaryView ? `${exportId}-${primaryView}` : exportId;
    const svgPath = path.join(dir, `${primaryFileTag}.svg`);
    const dxfPath = path.join(dir, `${primaryFileTag}.dxf`);

    await writeFileSafe(svgPath, Buffer.from(svg, 'utf8'));
    await writeFileSafe(dxfPath, Buffer.from(dxf, 'utf8'));

    for (const entry of viewExports) {
      if (usePrimaryView && entry.view === primaryView) continue;
      const viewSvgPath = path.join(dir, `${exportId}-${entry.view}.svg`);
      const viewDxfPath = path.join(dir, `${exportId}-${entry.view}.dxf`);
      await writeFileSafe(viewSvgPath, Buffer.from(entry.svg, 'utf8'));
      await writeFileSafe(viewDxfPath, Buffer.from(entry.dxf, 'utf8'));
    }

    const relSvg = path.posix.join(sessionId, `${primaryFileTag}.svg`);
    const relDxf = path.posix.join(sessionId, `${primaryFileTag}.dxf`);

    await execute(
      'INSERT INTO inscription_exports (session_id, export_id, project_hash, product, size_cm, font_id, font_name, color, client_name, client_contact, details_json, svg_path, dxf_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        sessionId,
        exportId,
        projectId,
        product,
        sizeCm,
        fontId,
        fontName,
        color,
        clientName,
        clientContact,
        detailsJson,
        relSvg,
        relDxf,
      ],
    );

    return NextResponse.json({ ok: true, exportId });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
