import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { removeArchivedPath } from '@/lib/files';
import { buildRedirectUrl } from '@/lib/request-url';
import { parsePositiveInt } from '@/lib/validation';

export const runtime = 'nodejs';

const VALID_TABS = new Set(['categories', 'fonts', 'colors', 'exports', 'archive']);
const VALID_SECTIONS = new Set(['categories', 'images', 'fonts', 'colors', 'exports']);

type ExportRow = {
  id: number;
  session_id: string;
  export_id: string;
  svg_path: string;
  dxf_path: string;
};

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const tabRaw = String(form.get('tab') ?? '');
  const tab = VALID_TABS.has(tabRaw) ? tabRaw : '';
  const sectionRaw = String(form.get('section') ?? '');
  const section = VALID_SECTIONS.has(sectionRaw) ? sectionRaw : '';
  const id = parsePositiveInt(form.get('id'));

  if (!id) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'exports');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<ExportRow>(
    'SELECT id, session_id, export_id, svg_path, dxf_path FROM inscription_exports WHERE id = ? AND is_deleted = 1 LIMIT 1',
    [id],
  );
  const exp = rows[0];
  if (!exp) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'exports');
    return NextResponse.redirect(url, 303);
  }

  const storageDir = path.resolve(process.cwd(), 'storage');
  if (exp.svg_path) {
    await removeArchivedPath(storageDir, path.posix.join('exports', exp.svg_path));
  }
  if (exp.dxf_path) {
    await removeArchivedPath(storageDir, path.posix.join('exports', exp.dxf_path));
  }

  const sideDir = path.resolve(storageDir, 'deleted', 'exports', exp.session_id);
  const prefix = `${exp.export_id}-`;
  const files = await fs.readdir(sideDir).catch(() => []);
  await Promise.all(
    files
      .filter((file) => file.startsWith(prefix) && (file.endsWith('.svg') || file.endsWith('.dxf')))
      .map((file) =>
        removeArchivedPath(storageDir, path.posix.join('exports', exp.session_id, file)),
      ),
  );

  await execute('DELETE FROM inscription_exports WHERE id = ?', [id]);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  if (section) url.searchParams.set('section', section);
  return NextResponse.redirect(url, 303);
}
