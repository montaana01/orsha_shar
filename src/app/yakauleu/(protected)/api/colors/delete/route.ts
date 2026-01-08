import { NextResponse, type NextRequest } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { buildRedirectUrl } from '@/lib/request-url';
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
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'colors');
    return NextResponse.redirect(url, 303);
  }

  await execute('UPDATE colors SET is_deleted = 1, visible = 0 WHERE id = ? AND is_deleted = 0', [
    id,
  ]);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
