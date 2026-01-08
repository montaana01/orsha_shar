import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
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
    url.searchParams.set('error', 'colors');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<{ id: number }>('SELECT id FROM colors WHERE id = ? AND is_deleted = 1 LIMIT 1', [id]);
  if (!rows[0]) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'colors');
    return NextResponse.redirect(url, 303);
  }

  await execute('UPDATE colors SET is_deleted = 0, visible = 1 WHERE id = ?', [id]);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  if (section) url.searchParams.set('section', section);
  return NextResponse.redirect(url, 303);
}
