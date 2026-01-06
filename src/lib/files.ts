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

async function movePath(src: string, dest: string): Promise<boolean> {
  let stat: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    stat = await fs.lstat(src);
  } catch {
    return false;
  }

  if (stat.isDirectory()) {
    await ensureDir(dest);
    let entries: string[];
    try {
      entries = await fs.readdir(src);
    } catch {
      return false;
    }
    let ok = true;
    for (const entry of entries) {
      ok = (await movePath(path.join(src, entry), path.join(dest, entry))) && ok;
    }
    try {
      await fs.rmdir(src);
    } catch {
      // Ignore cleanup errors for non-empty directories.
    }
    return ok;
  }

  await ensureDir(path.dirname(dest));
  try {
    await fs.rename(src, dest);
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EXDEV') {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
      return true;
    }
    if (err.code === 'EEXIST') {
      try {
        await fs.rm(dest, { force: true });
        await fs.rename(src, dest);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export async function archivePath(baseDir: string, relativePath: string): Promise<boolean> {
  const abs = path.resolve(baseDir, relativePath);
  const rel = path.relative(baseDir, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  const dest = path.resolve(baseDir, 'deleted', rel);
  return movePath(abs, dest);
}

export async function restorePath(baseDir: string, relativePath: string): Promise<boolean> {
  const abs = path.resolve(baseDir, relativePath);
  const rel = path.relative(baseDir, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  const src = path.resolve(baseDir, 'deleted', rel);
  return movePath(src, abs);
}

export async function removeArchivedPath(baseDir: string, relativePath: string): Promise<boolean> {
  const abs = path.resolve(baseDir, 'deleted', relativePath);
  const rel = path.relative(path.resolve(baseDir, 'deleted'), abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  try {
    await fs.unlink(abs);
    return true;
  } catch {
    return false;
  }
}

export async function getDiskUsage(targetPath: string): Promise<{ freeBytes: number; totalBytes: number; usedBytes: number }> {
  const stats = await fs.statfs(targetPath);
  const totalBytes = stats.blocks * stats.bsize;
  const freeBytes = stats.bavail * stats.bsize;
  return { freeBytes, totalBytes, usedBytes: totalBytes - freeBytes };
}

export function isAllowedExtension(name: string, exts: string[]): boolean {
  const ext = path.extname(name).toLowerCase();
  return exts.includes(ext);
}
