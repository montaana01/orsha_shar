import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { ensureDir, formatGalleryFileName, isAllowedExtension, writeFileSafe } from '@/lib/files';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { buildRedirectUrl } from '@/lib/request-url';
import { isSafeFileSize, normalizeSlug, parsePositiveInt } from '@/lib/validation';

export const runtime = 'nodejs';

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const categoryId = parsePositiveInt(form.get('category_id'));
  const files = form.getAll('files').filter(Boolean) as File[];

  if (!categoryId || !files.length) {
    return NextResponse.redirect(buildRedirectUrl(request, '/yakauleu?error=images'), 303);
  }

  const categoryRows = await query<{ slug: string }>(
    'SELECT slug FROM categories WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [categoryId]
  );
  const slug = normalizeSlug(categoryRows[0]?.slug ?? '');
  if (!slug) {
    return NextResponse.redirect(buildRedirectUrl(request, '/yakauleu?error=images'), 303);
  }

  const dir = path.join(process.cwd(), 'public', 'gallery', slug);
  await ensureDir(dir);

  const positions = await query<{ maxPos: number | null }>(
    'SELECT MAX(position) as maxPos FROM category_images WHERE category_id = ?',
    [categoryId]
  );
  let position = Number(positions[0]?.maxPos ?? 0) || 0;

  const accepted: File[] = [];
  let invalid = false;
  for (const file of files) {
    const original = file.name || 'image';
    if (!isAllowedExtension(original, ALLOWED_EXTS) || !isSafeFileSize(file.size, MAX_IMAGE_BYTES)) {
      invalid = true;
      continue;
    }
    accepted.push(file);
  }

  if (invalid || !accepted.length) {
    return NextResponse.redirect(buildRedirectUrl(request, '/yakauleu?error=images'), 303);
  }

  for (const file of accepted) {
    const original = file.name || 'image';
    position += 1;
    const fileName = formatGalleryFileName(position, original);
    const buf = await file.arrayBuffer();
    await writeFileSafe(path.join(dir, fileName), buf);
    await execute(
      'INSERT INTO category_images (category_id, file_name, visible, position) VALUES (?, ?, 1, ?)',
      [categoryId, fileName, position]
    );
  }

  return NextResponse.redirect(buildRedirectUrl(request, '/yakauleu'), 303);
}
