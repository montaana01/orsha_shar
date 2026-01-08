import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { restorePath } from '@/lib/files';
import { buildRedirectUrl } from '@/lib/request-url';
import { parsePositiveInt } from '@/lib/validation';

export const runtime = 'nodejs';

const VALID_TABS = new Set(['categories', 'fonts', 'colors', 'exports', 'archive']);
const VALID_SECTIONS = new Set(['categories', 'images', 'fonts', 'colors', 'exports']);

type ImageRow = {
  id: number;
  file_name: string;
  slug: string;
  category_deleted: number;
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
    url.searchParams.set('error', 'images');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<ImageRow>(
    `SELECT i.id, i.file_name, c.slug, c.is_deleted AS category_deleted
     FROM category_images i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = ? AND i.is_deleted = 1
     LIMIT 1`,
    [id]
  );
  const image = rows[0];
  if (!image || image.category_deleted) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'images');
    return NextResponse.redirect(url, 303);
  }

  const publicDir = path.resolve(process.cwd(), 'public');
  const restored = await restorePath(publicDir, path.join('gallery', image.slug, image.file_name));
  if (!restored) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'images-missing');
    return NextResponse.redirect(url, 303);
  }

  await execute('UPDATE category_images SET is_deleted = 0, visible = 1 WHERE id = ?', [id]);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  if (section) url.searchParams.set('section', section);
  return NextResponse.redirect(url, 303);
}
