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
    url.searchParams.set('error', 'images');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<{ file_name: string; slug: string }>(
    `SELECT i.file_name, c.slug
     FROM category_images i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = ?
     LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) {
    const url = new URL('/yakauleu', request.url);
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'images');
    return NextResponse.redirect(url, 303);
  }

  const baseDir = path.resolve(process.cwd(), 'public', 'gallery', row.slug);
  const filePath = path.resolve(baseDir, row.file_name);
  if (filePath.startsWith(`${baseDir}${path.sep}`)) {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }
  }

  await execute('DELETE FROM category_images WHERE id = ?', [id]);

  const url = new URL('/yakauleu', request.url);
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
