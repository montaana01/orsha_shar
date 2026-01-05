import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, buildAdminSessionCookieClear, destroyAdminSession } from '@/lib/admin-auth';
import { buildRedirectUrl } from '@/lib/request-url';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await destroyAdminSession(token);
  }
  const res = NextResponse.redirect(buildRedirectUrl(request, '/yakauleu/login'), 303);
  res.cookies.set(buildAdminSessionCookieClear());
  return res;
}
