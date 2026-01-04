import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute } from '@/lib/db';
import { ensureDir, isAllowedExtension, withRandomPrefix, writeFileSafe } from '@/lib/files';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { isSafeFileSize, normalizeSlug, optionalText, parseNonNegativeInt, requireText } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const title = requireText(String(form.get('title') ?? ''), 190);
  const slug = normalizeSlug(String(form.get('slug') ?? ''));
  const description = optionalText(String(form.get('description') ?? ''), 2000);
  const heroFile = form.get('hero_file') as File | null;
  const visible = form.get('visible') ? 1 : 0;
  const position = parseNonNegativeInt(form.get('position'), 9999);

  if (!title || !slug || description === null || !heroFile) {
    return NextResponse.redirect(new URL('/yakauleu?error=category', request.url), 303);
  }

  const original = heroFile.name || 'hero';
  const allowed = isAllowedExtension(original, ['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  const sized = isSafeFileSize(heroFile.size, 8 * 1024 * 1024);
  if (!allowed || !sized) {
    return NextResponse.redirect(new URL('/yakauleu?error=category', request.url), 303);
  }

  const dir = path.join(process.cwd(), 'public', 'gallery', slug);
  await ensureDir(dir);
  const fileName = withRandomPrefix(original, 'hero');
  await writeFileSafe(path.join(dir, fileName), await heroFile.arrayBuffer());
  const heroImage = `/gallery/${slug}/${fileName}`;

  await execute(
    'INSERT INTO categories (slug, title, description, hero_image, visible, position) VALUES (?, ?, ?, ?, ?, ?)',
    [slug, title, description, heroImage, visible, position]
  );

  return NextResponse.redirect(new URL('/yakauleu', request.url), 303);
}
