import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdminRequest, unauthorized } from '@/lib/admin-guard';
import { archiveExportFiles } from '@/lib/exports';
import { buildRedirectUrl } from '@/lib/request-url';
import { parsePositiveInt } from '@/lib/validation';

export const runtime = 'nodejs';

const VALID_TABS = new Set(['categories', 'fonts', 'colors', 'exports']);

type ExportRow = {
  session_id: string;
  export_id: string;
  svg_path: string;
  dxf_path: string;
};

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (!admin) return unauthorized();

  const form = await request.formData();
  const tabRaw = String(form.get('tab') ?? '');
  const tab = VALID_TABS.has(tabRaw) ? tabRaw : '';
  const id = parsePositiveInt(form.get('id'));

  if (!id) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'exports');
    return NextResponse.redirect(url, 303);
  }

  const rows = await query<ExportRow>(
    'SELECT session_id, export_id, svg_path, dxf_path FROM inscription_exports WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [id],
  );
  const exp = rows[0];
  if (!exp) {
    const url = buildRedirectUrl(request, '/yakauleu');
    if (tab) url.searchParams.set('tab', tab);
    url.searchParams.set('error', 'exports');
    return NextResponse.redirect(url, 303);
  }

  await execute('UPDATE inscription_exports SET is_deleted = 1 WHERE id = ?', [id]);

  const storageDir = path.resolve(process.cwd(), 'storage');
  await archiveExportFiles(storageDir, exp);

  const url = buildRedirectUrl(request, '/yakauleu');
  if (tab) url.searchParams.set('tab', tab);
  return NextResponse.redirect(url, 303);
}
