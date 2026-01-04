import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.replace(/_+/g, '_');
}

export function withRandomPrefix(name: string, prefix: string): string {
  const ext = path.extname(name).toLowerCase();
  const stem = sanitizeFileName(path.basename(name, ext)).slice(0, 40) || 'file';
  const token = crypto.randomBytes(6).toString('hex');
  return `${prefix}-${stem}-${token}${ext}`;
}

export function formatGalleryFileName(position: number, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const num = String(position).padStart(2, '0');
  return `img${num}${ext}`;
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeFileSafe(filePath: string, data: ArrayBuffer | Buffer) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : Uint8Array.from(data);
  await fs.writeFile(filePath, bytes);
}

export async function archivePath(baseDir: string, relativePath: string): Promise<boolean> {
  const abs = path.resolve(baseDir, relativePath);
  const rel = path.relative(baseDir, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  const dest = path.resolve(baseDir, 'deleted', rel);
  await ensureDir(path.dirname(dest));
  try {
    await fs.rename(abs, dest);
    return true;
  } catch {
    return false;
  }
}

export function isAllowedExtension(name: string, exts: string[]): boolean {
  const ext = path.extname(name).toLowerCase();
  return exts.includes(ext);
}
