import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
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
}

loadDotEnv();

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

function escapeSqlString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const email = process.env.ADMIN_EMAIL || 'shar@orsha-shar.by';
const password = process.env.ADMIN_PASSWORD;
const printSql = /^(1|true|yes)$/i.test(process.env.PRINT_SQL || '');

const host = process.env.MYSQL_HOST;
const user = process.env.MYSQL_USER;
const database = process.env.MYSQL_DATABASE;

if (!password) {
  console.error('Set ADMIN_PASSWORD env variable.');
  process.exit(1);
}

const passwordHash = hashPassword(password);

if (printSql) {
  const safeEmail = escapeSqlString(email);
  const safeHash = escapeSqlString(passwordHash);
  console.log(
    `INSERT INTO admin_users (email, password_hash, is_active) VALUES ('${safeEmail}', '${safeHash}', 1)\n` +
      `ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), is_active=1;`,
  );
  process.exit(0);
}

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

await pool.execute('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)', [
  email,
  passwordHash,
]);
await pool.end();

console.log(`Admin created: ${email}`);
