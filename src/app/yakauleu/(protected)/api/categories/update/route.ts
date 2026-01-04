import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { ensureDir, isAllowedExtension, withRandomPrefix, writeFileSafe } from '@/lib/files';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { isSafeFileSize, isSafePathSegment, normalizeSlug, optionalText, parseNonNegativeInt, parsePositiveInt, requireText } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const id = parsePositiveInt(form.get('id'));
  const title = requireText(String(form.get('title') ?? ''), 190);
  const slug = normalizeSlug(String(form.get('slug') ?? ''));
  const description = optionalText(String(form.get('description') ?? ''), 2000);
  const heroFile = form.get('hero_file') as File | null;
  const visible = form.get('visible') ? 1 : 0;
  const position = parseNonNegativeInt(form.get('position'), 9999);

  if (!id || !title || !slug || description === null) {
    return NextResponse.redirect(new URL('/yakauleu?error=category', request.url), 303);
  }

  const existing = await query<{ slug: string; hero_image: string }>('SELECT slug, hero_image FROM categories WHERE id = ? LIMIT 1', [
    id
  ]);
  const prevSlug = existing[0]?.slug ?? '';
  let heroImage = existing[0]?.hero_image ?? '';
  if (!prevSlug) {
    return NextResponse.redirect(new URL('/yakauleu?error=category', request.url), 303);
  }

  if (prevSlug && prevSlug !== slug && isSafePathSegment(prevSlug)) {
    const fromDir = path.join(process.cwd(), 'public', 'gallery', prevSlug);
    const toDir = path.join(process.cwd(), 'public', 'gallery', slug);
    try {
      await ensureDir(path.dirname(toDir));
      await fs.rename(fromDir, toDir);
    } catch {
      await ensureDir(toDir);
    }
  }

  if (heroFile) {
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
    heroImage = `/gallery/${slug}/${fileName}`;
  }

  if (!heroFile && heroImage && prevSlug !== slug && heroImage.startsWith(`/gallery/${prevSlug}/`)) {
    heroImage = `/gallery/${slug}/${path.basename(heroImage)}`;
  }

  if (!heroImage) {
    return NextResponse.redirect(new URL('/yakauleu?error=category', request.url), 303);
  }

  await execute(
    'UPDATE categories SET slug = ?, title = ?, description = ?, hero_image = ?, visible = ?, position = ? WHERE id = ?',
    [slug, title, description, heroImage, visible, position, id]
  );

  return NextResponse.redirect(new URL('/yakauleu', request.url), 303);
}
