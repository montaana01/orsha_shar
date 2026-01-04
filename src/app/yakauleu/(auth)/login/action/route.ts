import { NextResponse } from 'next/server';
import { buildAdminSessionCookie, createAdminSession, findAdminByEmail, verifyPassword } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const emailOk = email.length <= 190 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordOk = password.length > 0 && password.length <= 128;

  if (!emailOk || !passwordOk) {
    return NextResponse.redirect(new URL('/yakauleu/login?error=1', request.url), 303);
  }

  const admin = await findAdminByEmail(email);
  if (!admin || !admin.is_active || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.redirect(new URL('/yakauleu/login?error=1', request.url), 303);
  }

  const { token, expiresAt } = await createAdminSession(admin.id);
  const res = NextResponse.redirect(new URL('/yakauleu', request.url), 303);
  const cookie = buildAdminSessionCookie(token, expiresAt);
  res.cookies.set(cookie);
  return res;
}
