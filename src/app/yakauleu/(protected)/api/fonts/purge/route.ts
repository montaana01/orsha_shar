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
    url.searchParams.set('error', 'fonts');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<{ file_name: string }>('SELECT file_name FROM fonts WHERE id = ? AND is_deleted = 1 LIMIT 1', [id]);
  const font = rows[0];
  if (!font) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'fonts');
    return NextResponse.redirect(url, 303);
  }

  const publicDir = path.resolve(process.cwd(), 'public');
  await removeArchivedPath(publicDir, path.join('fonts', font.file_name));
  await execute('DELETE FROM fonts WHERE id = ?', [id]);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  if (section) url.searchParams.set('section', section);
  return NextResponse.redirect(url, 303);
}
