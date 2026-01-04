import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';

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
    const url = new URL('/yakauleu', request.url);
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'category');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<{ slug: string; hero_image: string }>('SELECT slug, hero_image FROM categories WHERE id = ? LIMIT 1', [
    id
  ]);
  const category = rows[0];
  if (!category) {
    const url = new URL('/yakauleu', request.url);
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'category');
    return NextResponse.redirect(url, 303);
  }

  const counts = await query<{ count: number }>('SELECT COUNT(*) as count FROM category_images WHERE category_id = ?', [id]);
  if ((counts[0]?.count ?? 0) > 0) {
    const url = new URL('/yakauleu', request.url);
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'category_has_images');
    return NextResponse.redirect(url, 303);
  }

  await execute('DELETE FROM categories WHERE id = ?', [id]);

  const baseDir = path.resolve(process.cwd(), 'public', 'gallery', category.slug);
  if (category.hero_image && category.hero_image.startsWith(`/gallery/${category.slug}/`)) {
    const heroPath = path.resolve(process.cwd(), 'public', category.hero_image.slice(1));
    if (heroPath.startsWith(`${baseDir}${path.sep}`)) {
      try {
        await fs.unlink(heroPath);
      } catch {
        // ignore missing file
      }
    }
  }

  try {
    const entries = await fs.readdir(baseDir);
    const remaining = entries.filter((name) => name !== '.DS_Store');
    if (remaining.length === 0) {
      await fs.rmdir(baseDir);
    }
  } catch {
    // ignore missing dir
  }

  const url = new URL('/yakauleu', request.url);
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
