import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { archivePath } from '@/lib/files';
import { parsePositiveInt } from '@/lib/validation';

export const runtime = 'nodejs';

const VALID_TABS = new Set(['categories', 'fonts', 'colors', 'exports']);

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const tabRaw = String(form.get('tab') ?? '');
  const tab = VALID_TABS.has(tabRaw) ? tabRaw : '';
  const id = parsePositiveInt(form.get('id'));

  if (!id) {
    const url = new URL('/yakauleu', request.url);
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'fonts');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<{ file_name: string }>('SELECT file_name FROM fonts WHERE id = ? AND is_deleted = 0 LIMIT 1', [id]);
  const font = rows[0];
  if (!font) {
    const url = new URL('/yakauleu', request.url);
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'fonts');
    return NextResponse.redirect(url, 303);
  }

  await execute('UPDATE fonts SET is_deleted = 1, visible = 0 WHERE id = ?', [id]);

  const publicDir = path.resolve(process.cwd(), 'public');
  await archivePath(publicDir, path.join('fonts', font.file_name));

  const url = new URL('/yakauleu', request.url);
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
