import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, buildAdminSessionCookieClear, destroyAdminSession } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await destroyAdminSession(token);
  }
  const res = NextResponse.redirect(new URL('/yakauleu/login', request.url), 303);
  res.cookies.set(buildAdminSessionCookieClear());
  return res;
}
