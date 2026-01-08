import { site } from '@/content/site';

function firstHeaderValue(value: string | null): string {
  if (!value) return '';
  return value.split(',')[0]?.trim() ?? '';
}

function isLocalHost(host: string): boolean {
  const base = host.split(':')[0]?.trim();
  return base === 'localhost' || base === '127.0.0.1' || base === '0.0.0.0';
}

function parseHost(host: string): { hostname: string; port: string | null } {
  try {
    const url = new URL(`http://${host}`);
    return { hostname: url.hostname, port: url.port || null };
  } catch {
    return { hostname: host, port: null };
  }
}

export function getRequestOrigin(request: Request): string {
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const host = forwardedHost || firstHeaderValue(request.headers.get('host'));

  const proto =
    forwardedProto ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0')
      ? 'http'
      : 'https');

  const local = host ? isLocalHost(host) : false;
  const siteUrl = new URL(site.url);
  const siteHost = siteUrl.hostname;
  if (host) {
    const parsed = parseHost(host);
    const hasOddPort =
      parsed.port !== null && parsed.port !== '' && parsed.port !== '443' && parsed.port !== '80';
    const hostMismatch = parsed.hostname !== siteHost;
    if (local) return `${proto}://${host}`;
    if (hostMismatch || hasOddPort) return site.url;
    return `${proto}://${host}`;
  }
  return site.url;
}

export function buildRedirectUrl(request: Request, path: string): URL {
  return new URL(path, getRequestOrigin(request));
}
