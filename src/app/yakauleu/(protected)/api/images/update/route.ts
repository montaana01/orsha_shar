import { NextResponse, type NextRequest } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { parseNonNegativeInt, parsePositiveInt } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const id = parsePositiveInt(form.get('id'));
  const visible = form.get('visible') ? 1 : 0;
  const position = parseNonNegativeInt(form.get('position'), 9999);

  if (!id) {
    return NextResponse.redirect(new URL('/yakauleu?error=images', request.url), 303);
  }

  await execute('UPDATE category_images SET visible = ?, position = ? WHERE id = ? AND is_deleted = 0', [visible, position, id]);

  return NextResponse.redirect(new URL('/yakauleu', request.url), 303);
}
