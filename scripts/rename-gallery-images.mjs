import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2];
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // ignore missing .env
  }
}

function formatName(index, ext) {
  const num = String(index).padStart(2, '0');
  return `img${num}${ext || '.jpg'}`;
}

loadDotEnv();

const host = process.env.MYSQL_HOST;
const user = process.env.MYSQL_USER;
const database = process.env.MYSQL_DATABASE;
const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN || '');

if (!host || !user || !database) {
  console.error('Missing MYSQL_HOST/MYSQL_USER/MYSQL_DATABASE env variables.');
  process.exit(1);
}

const pool = mysql.createPool({
  host,
  user,
  password: process.env.MYSQL_PASSWORD,
  database,
  port: Number(process.env.MYSQL_PORT || '3306'),
});

const [categories] = await pool.query(
  'SELECT id, slug, hero_image FROM categories ORDER BY id ASC',
);
const galleryRoot = path.resolve(process.cwd(), 'public', 'gallery');

for (const category of categories) {
  const slug = category.slug;
  const dir = path.join(galleryRoot, slug);
  let entries;
  try {
    entries = await fsp.readdir(dir);
  } catch {
    console.warn(`Skip ${slug}: gallery folder not found`);
    continue;
  }
  if (!entries.length) continue;

  const [images] = await pool.query(
    'SELECT id, file_name, position FROM category_images WHERE category_id = ? ORDER BY position ASC, id ASC',
    [category.id],
  );
  if (!images.length) continue;

  const items = images.map((row, idx) => {
    const ext = path.extname(row.file_name).toLowerCase() || '.jpg';
    return {
      id: row.id,
      oldName: row.file_name,
      newName: formatName(idx + 1, ext),
      newPosition: idx + 1,
    };
  });

  let missing = false;
  for (const item of items) {
    try {
      await fsp.stat(path.join(dir, item.oldName));
    } catch {
      console.warn(`Skip ${slug}: missing ${item.oldName}`);
      missing = true;
      break;
    }
  }
  if (missing) continue;

  const renames = items
    .filter((item) => item.oldName !== item.newName)
    .map((item) => ({
      ...item,
      tempName: `${item.oldName}.tmp-${crypto.randomBytes(4).toString('hex')}`,
    }));

  if (dryRun) {
    console.log(`[DRY_RUN] ${slug}`);
    for (const item of renames) {
      console.log(`  ${item.oldName} -> ${item.newName}`);
    }
    continue;
  }

  for (const item of renames) {
    await fsp.rename(path.join(dir, item.oldName), path.join(dir, item.tempName));
  }
  for (const item of renames) {
    await fsp.rename(path.join(dir, item.tempName), path.join(dir, item.newName));
  }

  const heroPath = String(category.hero_image || '');
  for (const item of items) {
    if (heroPath === `/gallery/${slug}/${item.oldName}` && item.oldName !== item.newName) {
      await pool.execute('UPDATE categories SET hero_image = ? WHERE id = ?', [
        `/gallery/${slug}/${item.newName}`,
        category.id,
      ]);
      break;
    }
  }

  for (const item of items) {
    await pool.execute('UPDATE category_images SET file_name = ?, position = ? WHERE id = ?', [
      item.newName,
      item.newPosition,
      item.id,
    ]);
  }

  console.log(`Renamed ${slug}: ${items.length} files`);
}

await pool.end();
