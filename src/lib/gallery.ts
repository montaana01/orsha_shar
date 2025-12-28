import fs from 'node:fs';
import path from 'node:path';

export function listGalleryImages(slug: string): string[] {
  const dir = path.join(process.cwd(), 'public', 'gallery', slug);
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith('.') && /\.(png|jpe?g|webp|gif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  return files.map((f) => `/gallery/${slug}/${f}`);
}
