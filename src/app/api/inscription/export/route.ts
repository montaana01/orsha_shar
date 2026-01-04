import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { PRODUCT_SIZES_CM } from '@/content/inscription';
import { execute } from '@/lib/db';
import { ensureDir, writeFileSafe } from '@/lib/files';
import { isSafePathSegment, normalizeHexColor, requireText } from '@/lib/validation';

export const runtime = 'nodejs';

function safeSegment(input: string) {
  const cleaned = input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return cleaned || `sess-${crypto.randomBytes(4).toString('hex')}`;
}

const MAX_EXPORT_CHARS = 2_000_000;

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

    if (!sessionIdRaw || !projectId || !product || !sizeCm || !svg || !dxf || !fontName || !color) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
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

    const sessionId = safeSegment(sessionIdRaw);
    const exportId = crypto.randomBytes(10).toString('hex');

    const dir = path.join(process.cwd(), 'storage', 'exports', sessionId);
    await ensureDir(dir);

    const svgPath = path.join(dir, `${exportId}.svg`);
    const dxfPath = path.join(dir, `${exportId}.dxf`);

    await writeFileSafe(svgPath, Buffer.from(svg, 'utf8'));
    await writeFileSafe(dxfPath, Buffer.from(dxf, 'utf8'));

    const relSvg = path.posix.join(sessionId, `${exportId}.svg`);
    const relDxf = path.posix.join(sessionId, `${exportId}.dxf`);

    await execute(
      'INSERT INTO inscription_exports (session_id, export_id, project_hash, product, size_cm, font_id, font_name, color, svg_path, dxf_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [sessionId, exportId, projectId, product, sizeCm, fontId, fontName, color, relSvg, relDxf]
    );

    return NextResponse.json({ ok: true, exportId });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
