import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';

export const runtime = 'nodejs';

type ExportRow = {
  id: number;
  svg_path: string;
  dxf_path: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const { id } = await params;
  const exportId = Number(id);
  if (!exportId) {
    return NextResponse.json({ error: 'Invalid export id' }, { status: 400 });
  }

  const rows = await query<ExportRow>(
    'SELECT id, svg_path, dxf_path FROM inscription_exports WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [exportId]
  );
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'svg';
  const relPath = type === 'dxf' ? row.dxf_path : row.svg_path;
  const baseDir = path.resolve(process.cwd(), 'storage', 'exports');
  const filePath = path.resolve(baseDir, relPath);
  if (!filePath.startsWith(`${baseDir}${path.sep}`) && filePath !== baseDir) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const contentType = type === 'dxf' ? 'application/dxf' : 'image/svg+xml';
    const ext = type === 'dxf' ? 'dxf' : 'svg';
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="export-${row.id}.${ext}"`
      }
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
