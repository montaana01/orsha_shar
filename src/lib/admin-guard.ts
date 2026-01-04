import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminFromToken } from './admin-auth';

export async function requireAdminRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return getAdminFromToken(token);
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
