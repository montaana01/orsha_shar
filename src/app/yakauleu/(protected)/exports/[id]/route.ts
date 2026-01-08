import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { PRODUCT_FILE_LABEL, type ProductType } from '@/content/inscription';
import { query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { isSafePathSegment } from '@/lib/validation';

export const runtime = 'nodejs';

type ExportRow = {
  id: number;
  session_id: string;
  export_id: string;
  product: string;
  size_cm: number;
  created_at: Date;
  svg_path: string;
  dxf_path: string;
};

function formatDateStamp(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sanitizeFileTag(input: string) {
  const cleaned = input.replace(/[^\w-]/g, '').toLowerCase();
  return cleaned || 'item';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const { id } = await params;
  const exportId = Number(id);
  if (!exportId) {
    return NextResponse.json({ error: 'Invalid export id' }, { status: 400 });
  }

  const rows = await query<ExportRow>(
    'SELECT id, session_id, export_id, product, size_cm, created_at, svg_path, dxf_path FROM inscription_exports WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [exportId],
  );
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'svg';
  const view = request.nextUrl.searchParams.get('view');
  let relPath = type === 'dxf' ? row.dxf_path : row.svg_path;
  let fileSuffix = '';
  if (view) {
    if (!isSafePathSegment(view, 40)) {
      return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
    }
    const ext = type === 'dxf' ? 'dxf' : 'svg';
    relPath = path.posix.join(row.session_id, `${row.export_id}-${view}.${ext}`);
    const viewTag = view.startsWith('foil-') ? view.replace('foil-', '') : view;
    fileSuffix = `-${viewTag}`;
  }
  const baseDir = path.resolve(process.cwd(), 'storage', 'exports');
  const filePath = path.resolve(baseDir, relPath);
  if (!filePath.startsWith(`${baseDir}${path.sep}`) && filePath !== baseDir) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const contentType = type === 'dxf' ? 'application/dxf' : 'image/svg+xml';
    const ext = type === 'dxf' ? 'dxf' : 'svg';
    const productTag =
      PRODUCT_FILE_LABEL[row.product as ProductType] ?? sanitizeFileTag(row.product);
    const dateStamp = formatDateStamp(new Date(row.created_at));
    const baseName = `${dateStamp}_${row.id}_${productTag}_${row.size_cm}cm`;
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${baseName}${fileSuffix}.${ext}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
