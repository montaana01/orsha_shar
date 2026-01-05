import { site } from '@/content/site';

function firstHeaderValue(value: string | null): string {
  if (!value) return '';
  return value.split(',')[0]?.trim() ?? '';
}

export function getRequestOrigin(request: Request): string {
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const host = forwardedHost || firstHeaderValue(request.headers.get('host'));

  const proto =
    forwardedProto ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0') ? 'http' : 'https');

  if (host) return `${proto}://${host}`;
  return site.url;
}

export function buildRedirectUrl(request: Request, path: string): URL {
  return new URL(path, getRequestOrigin(request));
}
