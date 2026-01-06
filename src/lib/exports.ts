import fs from 'node:fs/promises';
import path from 'node:path';
import { query } from './db';
import { archivePath, removeArchivedPath, restorePath } from './files';

export const EXPORT_RETENTION_DAYS = 21;
const DAY_MS = 24 * 60 * 60 * 1000;

type ExportFilesRow = {
  id: number;
  session_id: string;
  export_id: string;
  svg_path: string;
  dxf_path: string;
  updated_at: Date;
};

async function listSideFiles(
  baseDir: string,
  segment: string,
  sessionId: string,
  exportId: string
): Promise<string[]> {
  const dir = path.resolve(baseDir, segment, sessionId);
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const prefix = `${exportId}-`;
  return files
    .filter((file) => file.startsWith(prefix) && (file.endsWith('.svg') || file.endsWith('.dxf')))
    .map((file) => path.posix.join(sessionId, file));
}

export async function archiveExportFiles(baseDir: string, exp: { session_id: string; export_id: string; svg_path: string; dxf_path: string }) {
  if (exp.svg_path) {
    await archivePath(baseDir, path.posix.join('exports', exp.svg_path));
  }
  if (exp.dxf_path) {
    await archivePath(baseDir, path.posix.join('exports', exp.dxf_path));
  }

  const sideFiles = await listSideFiles(baseDir, 'exports', exp.session_id, exp.export_id);
  await Promise.all(sideFiles.map((rel) => archivePath(baseDir, path.posix.join('exports', rel))));
}

export async function restoreExportFiles(baseDir: string, exp: { session_id: string; export_id: string; svg_path: string; dxf_path: string }) {
  const svgRel = exp.svg_path ? path.posix.join('exports', exp.svg_path) : '';
  const dxfRel = exp.dxf_path ? path.posix.join('exports', exp.dxf_path) : '';
  const svgArchived = svgRel
    ? await fs
        .access(path.resolve(baseDir, 'deleted', svgRel))
        .then(() => true)
        .catch(() => false)
    : true;
  const dxfArchived = dxfRel
    ? await fs
        .access(path.resolve(baseDir, 'deleted', dxfRel))
        .then(() => true)
        .catch(() => false)
    : true;
  if (!svgArchived || !dxfArchived) return false;

  let restored = true;
  if (svgRel) {
    restored = (await restorePath(baseDir, svgRel)) && restored;
  }
  if (dxfRel) {
    restored = (await restorePath(baseDir, dxfRel)) && restored;
  }

  const sideFiles = await listSideFiles(baseDir, path.posix.join('deleted', 'exports'), exp.session_id, exp.export_id);
  await Promise.all(sideFiles.map((rel) => restorePath(baseDir, path.posix.join('exports', rel))));
  return restored;
}

export async function purgeExpiredExports(days = EXPORT_RETENTION_DAYS) {
  const cutoff = new Date(Date.now() - days * DAY_MS);
  const rows = await query<ExportFilesRow>(
    `SELECT id, session_id, export_id, svg_path, dxf_path, updated_at
     FROM inscription_exports
     WHERE is_deleted = 1 AND updated_at < ?`,
    [cutoff]
  );
  if (!rows.length) return 0;

  const storageDir = path.resolve(process.cwd(), 'storage');
  let removed = 0;
  for (const row of rows) {
    if (row.svg_path) {
      if (await removeArchivedPath(storageDir, path.posix.join('exports', row.svg_path))) removed += 1;
    }
    if (row.dxf_path) {
      if (await removeArchivedPath(storageDir, path.posix.join('exports', row.dxf_path))) removed += 1;
    }
    const sideFiles = await listSideFiles(storageDir, path.posix.join('deleted', 'exports'), row.session_id, row.export_id);
    const sideRemovals = await Promise.all(
      sideFiles.map((rel) => removeArchivedPath(storageDir, path.posix.join('exports', rel)))
    );
    removed += sideRemovals.filter(Boolean).length;
  }
  return removed;
}
