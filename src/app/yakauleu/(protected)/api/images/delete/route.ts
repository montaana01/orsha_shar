import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { archivePath } from '@/lib/files';
import { buildRedirectUrl } from '@/lib/request-url';

export const runtime = 'nodejs';

const VALID_TABS = new Set(['categories', 'fonts', 'colors', 'exports']);

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const tabRaw = String(form.get('tab') ?? '');
  const tab = VALID_TABS.has(tabRaw) ? tabRaw : '';
  const id = Number(form.get('id') ?? 0);

  if (!id) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'images');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<{ file_name: string; slug: string }>(
    `SELECT i.file_name, c.slug
     FROM category_images i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = ? AND i.is_deleted = 0 AND c.is_deleted = 0
     LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'images');
    return NextResponse.redirect(url, 303);
  }

  await execute('UPDATE category_images SET is_deleted = 1, visible = 0 WHERE id = ?', [id]);

  const publicDir = path.resolve(process.cwd(), 'public');
  await archivePath(publicDir, path.join('gallery', row.slug, row.file_name));

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
