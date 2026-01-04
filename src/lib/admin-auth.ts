import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { execute, query } from './db';

type AdminUser = {
  id: number;
  email: string;
  password_hash: string;
  is_active: number;
};

type AdminSession = {
  id: number;
  admin_id: number;
  token_hash: string;
  expires_at: Date;
};

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_DAYS = 30;

function toUint8Array(value: Buffer): Uint8Array {
  return Uint8Array.from(value);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, toUint8Array(salt), 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const key = crypto.scryptSync(password, toUint8Array(salt), expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr)
  });
  return crypto.timingSafeEqual(toUint8Array(expected), toUint8Array(key));
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const rows = await query<AdminUser>('SELECT * FROM admin_users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ?? null;
}

export async function createAdminSession(adminId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await execute('INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)', [
    adminId,
    tokenHash,
    expiresAt.toISOString().slice(0, 19).replace('T', ' ')
  ]);
  return { token, expiresAt };
}

export async function getAdminFromToken(token: string): Promise<{ id: number; email: string } | null> {
  const tokenHash = hashToken(token);
  const rows = await query<AdminSession & { email: string }>(
    `SELECT s.id, s.admin_id, s.token_hash, s.expires_at, u.email
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.admin_id
     WHERE s.token_hash = ? AND u.is_active = 1
     LIMIT 1`,
    [tokenHash]
  );
  const session = rows[0];
  if (!session) return null;
  const now = new Date();
  if (new Date(session.expires_at) < now) return null;
  await execute('UPDATE admin_sessions SET last_seen_at = NOW() WHERE id = ?', [session.id]);
  return { id: session.admin_id, email: session.email };
}

export async function requireAdmin() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) redirect('/yakauleu/login');
  const admin = await getAdminFromToken(token);
  if (!admin) redirect('/yakauleu/login');
  return admin;
}

export async function destroyAdminSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await execute('DELETE FROM admin_sessions WHERE token_hash = ?', [tokenHash]);
}

export function buildAdminSessionCookie(token: string, expiresAt: Date) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  };
}

export function buildAdminSessionCookieClear() {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/'
  };
}
