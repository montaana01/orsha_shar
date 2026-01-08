import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { EXPORT_RETENTION_DAYS, restoreExportFiles } from '@/lib/exports';
import { buildRedirectUrl } from '@/lib/request-url';
import { parsePositiveInt } from '@/lib/validation';

export const runtime = 'nodejs';

const VALID_TABS = new Set(['categories', 'fonts', 'colors', 'exports', 'archive']);
const VALID_SECTIONS = new Set(['categories', 'images', 'fonts', 'colors', 'exports']);
const DAY_MS = 24 * 60 * 60 * 1000;

type ExportRow = {
  id: number;
  session_id: string;
  export_id: string;
  svg_path: string;
  dxf_path: string;
  updated_at: Date;
};

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const tabRaw = String(form.get('tab') ?? '');
  const tab = VALID_TABS.has(tabRaw) ? tabRaw : '';
  const sectionRaw = String(form.get('section') ?? '');
  const section = VALID_SECTIONS.has(sectionRaw) ? sectionRaw : '';
  const id = parsePositiveInt(form.get('id'));

  if (!id) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'exports');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<ExportRow>(
    'SELECT id, session_id, export_id, svg_path, dxf_path, updated_at FROM inscription_exports WHERE id = ? AND is_deleted = 1 LIMIT 1',
    [id]
  );
  const exp = rows[0];
  if (!exp) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'exports');
    return NextResponse.redirect(url, 303);
  }

  const expiresAt = new Date(exp.updated_at).getTime() + EXPORT_RETENTION_DAYS * DAY_MS;
  if (Date.now() > expiresAt) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'exports-expired');
    return NextResponse.redirect(url, 303);
  }

  const storageDir = path.resolve(process.cwd(), 'storage');
  const restored = await restoreExportFiles(storageDir, exp);
  if (!restored) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section', section);
    url.searchParams.set('error', 'exports-missing');
    return NextResponse.redirect(url, 303);
  }

  await execute('UPDATE inscription_exports SET is_deleted = 0 WHERE id = ?', [id]);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  if (section) url.searchParams.set('section', section);
  return NextResponse.redirect(url, 303);
}
