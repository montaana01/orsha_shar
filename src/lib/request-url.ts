import { site } from '@/content/site';

function firstHeaderValue(value: string | null): string {
  if (!value) return '';
  return value.split(',')[0]?.trim() ?? '';
}

function isLocalHost(host: string): boolean {
  const base = host.split(':')[0]?.trim();
  return base === 'localhost' || base === '127.0.0.1' || base === '0.0.0.0';
}

export function getRequestOrigin(request: Request): string {
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const host = forwardedHost || firstHeaderValue(request.headers.get('host'));

  const proto =
    forwardedProto ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0') ? 'http' : 'https');

  const local = host ? isLocalHost(host) : false;
  if (host && (!local || process.env.NODE_ENV !== 'production')) return `${proto}://${host}`;
  return site.url;
}

export function buildRedirectUrl(request: Request, path: string): URL {
  return new URL(path, getRequestOrigin(request));
}
