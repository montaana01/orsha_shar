import { NextResponse, type NextRequest } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { buildRedirectUrl } from '@/lib/request-url';
import {
  normalizeHexColor,
  parseNonNegativeInt,
  parsePositiveInt,
  requireText,
} from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const tabRaw = String(form.get('tab') ?? '');
  const tab = ['categories', 'fonts', 'colors', 'exports'].includes(tabRaw) ? tabRaw : '';
  const id = parsePositiveInt(form.get('id'));
  const name = requireText(String(form.get('name') ?? ''), 190);
  const value = normalizeHexColor(String(form.get('value') ?? ''));
  const visible = form.get('visible') ? 1 : 0;
  const position = parseNonNegativeInt(form.get('position'), 9999);

  if (!id || !name || !value) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'colors');
    return NextResponse.redirect(url, 303);
  }

  await execute(
    'UPDATE colors SET name = ?, value = ?, visible = ?, position = ? WHERE id = ? AND is_deleted = 0',
    [name, value, visible, position, id],
  );

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
