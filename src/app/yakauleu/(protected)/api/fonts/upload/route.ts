import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute } from '@/lib/db';
import { ensureDir, isAllowedExtension, withRandomPrefix, writeFileSafe } from '@/lib/files';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { buildRedirectUrl } from '@/lib/request-url';
import { isSafeFileSize, parseNonNegativeInt, requireText } from '@/lib/validation';

export const runtime = 'nodejs';

const ALLOWED_EXTS = ['.ttf', '.otf'];
const MAX_FONT_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const tabRaw = String(form.get('tab') ?? '');
  const tab = ['categories', 'fonts', 'colors', 'exports'].includes(tabRaw) ? tabRaw : '';
  const name = requireText(String(form.get('name') ?? ''), 190);
  const visible = form.get('visible') ? 1 : 0;
  const position = parseNonNegativeInt(form.get('position'), 9999);
  const file = form.get('file') as File | null;

  if (!name || !file) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'fonts');
    return NextResponse.redirect(url, 303);
  }

  const original = file.name || 'font';
  if (!isAllowedExtension(original, ALLOWED_EXTS) || !isSafeFileSize(file.size, MAX_FONT_BYTES)) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'fonts');
    return NextResponse.redirect(url, 303);
  }

  const fileName = withRandomPrefix(original, 'font');
  const dir = path.join(process.cwd(), 'public', 'fonts');
  await ensureDir(dir);
  await writeFileSafe(path.join(dir, fileName), await file.arrayBuffer());

  await execute('INSERT INTO fonts (name, file_name, visible, position) VALUES (?, ?, ?, ?)', [
    name,
    fileName,
    visible,
    position,
  ]);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
