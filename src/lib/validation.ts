const SLUG_RE = /^[\da-z][\d_a-z-]*$/;
const HEX_RE = /^#([\dA-Fa-f]{3}|[\dA-Fa-f]{6})$/;
const SAFE_SEGMENT_RE = /^[\w-]+$/;

export function normalizeSlug(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (!value || value.length > 80) return null;
  if (!SLUG_RE.test(value)) return null;
  return value;
}

export function isSafePathSegment(input: string, maxLen = 80): boolean {
  const value = input.trim();
  if (!value || value.length > maxLen) return false;
  return SAFE_SEGMENT_RE.test(value);
}

export function requireText(input: string, maxLen: number): string | null {
  const value = input.trim();
  if (!value || value.length > maxLen) return null;
  return value;
}

export function optionalText(input: string, maxLen: number): string | null {
  const value = input.trim();
  if (!value) return '';
  if (value.length > maxLen) return null;
  return value;
}

export function normalizePublicPath(input: string, maxLen = 255): string | null {
  const value = input.trim();
  if (!value) return '';
  if (value.length > maxLen) return null;
  if (!value.startsWith('/')) return null;
  if (value.includes('..') || value.includes('\\') || value.includes('://')) return null;
  return value;
}

export function normalizeHexColor(input: string): string | null {
  const value = input.trim();
  if (!HEX_RE.test(value)) return null;
  return value;
}

export function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || !value) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const int = Math.trunc(num);
  if (int <= 0) return null;
  return int;
}

export function parseNonNegativeInt(value: FormDataEntryValue | null, max = 100000): number {
  if (typeof value !== 'string' || !value) return 0;
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  const int = Math.trunc(num);
  if (int < 0) return 0;
  return Math.min(int, max);
}

export function isSafeFileSize(size: number, maxBytes: number): boolean {
  return Number.isFinite(size) && size > 0 && size <= maxBytes;
}
