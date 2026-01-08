import { query } from './db';

export type Category = {
  id: number;
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  visible: boolean;
  position: number;
};

export type CategoryImage = {
  id: number;
  categoryId: number;
  categorySlug: string;
  fileName: string;
  url: string;
  visible: boolean;
  position: number;
};

export type FontPreset = {
  id: number;
  name: string;
  fileName: string;
  fileUrl: string;
  visible: boolean;
  position: number;
};

export type ColorPreset = {
  id: number;
  name: string;
  value: string;
  visible: boolean;
  position: number;
};

export type ExportRecord = {
  id: number;
  sessionId: string;
  exportId: string;
  projectHash: string;
  product: string;
  sizeCm: number;
  fontId: number | null;
  fontName: string;
  color: string;
  clientName: string;
  clientContact: string;
  detailsJson: string;
  svgPath: string;
  dxfPath: string;
  createdAt: Date;
};

export type DeletedCategory = Category & { deletedAt: Date };
export type DeletedCategoryImage = CategoryImage & { deletedAt: Date };
export type DeletedFont = FontPreset & { deletedAt: Date };
export type DeletedColor = ColorPreset & { deletedAt: Date };
export type DeletedExport = ExportRecord & { deletedAt: Date };

export async function getCategories(opts: { includeHidden?: boolean } = {}): Promise<Category[]> {
  const { includeHidden = false } = opts;
  const rows = await query<{
    id: number;
    slug: string;
    title: string;
    description: string;
    hero_image: string;
    visible: number;
    position: number;
  }>(
    `SELECT id, slug, title, description, hero_image, visible, position
     FROM categories
     WHERE is_deleted = 0 ${includeHidden ? '' : 'AND visible = 1'}
     ORDER BY position ASC, id ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    heroImage: row.hero_image,
    visible: Boolean(row.visible),
    position: row.position
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await query<{
    id: number;
    slug: string;
    title: string;
    description: string;
    hero_image: string;
    visible: number;
    position: number;
  }>(
    `SELECT id, slug, title, description, hero_image, visible, position
     FROM categories
     WHERE slug = ? AND is_deleted = 0
     LIMIT 1`,
    [slug]
  );

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    heroImage: row.hero_image,
    visible: Boolean(row.visible),
    position: row.position
  };
}

export async function getCategoryImages(categoryId: number, opts: { includeHidden?: boolean } = {}): Promise<CategoryImage[]> {
  const { includeHidden = false } = opts;
  const rows = await query<{
    id: number;
    category_id: number;
    file_name: string;
    visible: number;
    position: number;
    slug: string;
  }>(
    `SELECT i.id, i.category_id, i.file_name, i.visible, i.position, c.slug
     FROM category_images i
     JOIN categories c ON c.id = i.category_id
     WHERE i.category_id = ? AND i.is_deleted = 0 AND c.is_deleted = 0
     ${includeHidden ? '' : 'AND i.visible = 1'}
     ORDER BY i.position ASC, i.id ASC`,
    [categoryId]
  );

  return rows.map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    categorySlug: row.slug,
    fileName: row.file_name,
    url: `/gallery/${row.slug}/${row.file_name}`,
    visible: Boolean(row.visible),
    position: row.position
  }));
}

export async function getCategoryImagesBySlug(slug: string, opts: { includeHidden?: boolean } = {}): Promise<CategoryImage[]> {
  const { includeHidden = false } = opts;
  const rows = await query<{
    id: number;
    category_id: number;
    file_name: string;
    visible: number;
    position: number;
    slug: string;
  }>(
    `SELECT i.id, i.category_id, i.file_name, i.visible, i.position, c.slug
     FROM category_images i
     JOIN categories c ON c.id = i.category_id
     WHERE c.slug = ? AND i.is_deleted = 0 AND c.is_deleted = 0
     ${includeHidden ? '' : 'AND i.visible = 1'}
     ORDER BY i.position ASC, i.id ASC`,
    [slug]
  );

  return rows.map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    categorySlug: row.slug,
    fileName: row.file_name,
    url: `/gallery/${row.slug}/${row.file_name}`,
    visible: Boolean(row.visible),
    position: row.position
  }));
}

export async function getFonts(opts: { includeHidden?: boolean } = {}): Promise<FontPreset[]> {
  const { includeHidden = false } = opts;
  const rows = await query<{
    id: number;
    name: string;
    file_name: string;
    visible: number;
    position: number;
  }>(
    `SELECT id, name, file_name, visible, position
     FROM fonts
     WHERE is_deleted = 0 ${includeHidden ? '' : 'AND visible = 1'}
     ORDER BY position ASC, id ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    fileName: row.file_name,
    fileUrl: `/fonts/${row.file_name}`,
    visible: Boolean(row.visible),
    position: row.position
  }));
}

export async function getColors(opts: { includeHidden?: boolean } = {}): Promise<ColorPreset[]> {
  const { includeHidden = false } = opts;
  const rows = await query<{
    id: number;
    name: string;
    value: string;
    visible: number;
    position: number;
  }>(
    `SELECT id, name, value, visible, position
     FROM colors
     WHERE is_deleted = 0 ${includeHidden ? '' : 'AND visible = 1'}
     ORDER BY position ASC, id ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: row.value,
    visible: Boolean(row.visible),
    position: row.position
  }));
}

export async function getExports(): Promise<ExportRecord[]> {
  const rows = await query<{
    id: number;
    session_id: string;
    export_id: string;
    project_hash: string;
    product: string;
    size_cm: number;
    font_id: number | null;
    font_name: string;
    color: string;
    client_name: string | null;
    client_contact: string | null;
    details_json: string | null;
    svg_path: string;
    dxf_path: string;
    created_at: Date;
  }>(
    `SELECT id, session_id, export_id, project_hash, product, size_cm, font_id, font_name, color, client_name, client_contact, details_json, svg_path, dxf_path, created_at
     FROM inscription_exports
     WHERE is_deleted = 0
     ORDER BY created_at DESC, id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    exportId: row.export_id,
    projectHash: row.project_hash,
    product: row.product,
    sizeCm: row.size_cm,
    fontId: row.font_id,
    fontName: row.font_name,
    color: row.color,
    clientName: row.client_name ?? '',
    clientContact: row.client_contact ?? '',
    detailsJson: row.details_json ?? '',
    svgPath: row.svg_path,
    dxfPath: row.dxf_path,
    createdAt: row.created_at
  }));
}

export async function getDeletedCategories(): Promise<DeletedCategory[]> {
  const rows = await query<{
    id: number;
    slug: string;
    title: string;
    description: string;
    hero_image: string;
    visible: number;
    position: number;
    updated_at: Date;
  }>(
    `SELECT id, slug, title, description, hero_image, visible, position, updated_at
     FROM categories
     WHERE is_deleted = 1
     ORDER BY updated_at DESC, id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    heroImage: row.hero_image,
    visible: Boolean(row.visible),
    position: row.position,
    deletedAt: row.updated_at
  }));
}

export async function getDeletedCategoryImages(): Promise<DeletedCategoryImage[]> {
  const rows = await query<{
    id: number;
    category_id: number;
    file_name: string;
    visible: number;
    position: number;
    slug: string;
    updated_at: Date;
  }>(
    `SELECT i.id, i.category_id, i.file_name, i.visible, i.position, c.slug, i.updated_at
     FROM category_images i
     JOIN categories c ON c.id = i.category_id
     WHERE i.is_deleted = 1
     ORDER BY i.updated_at DESC, i.id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    categorySlug: row.slug,
    fileName: row.file_name,
    url: `/deleted/gallery/${row.slug}/${row.file_name}`,
    visible: Boolean(row.visible),
    position: row.position,
    deletedAt: row.updated_at
  }));
}

export async function getDeletedFonts(): Promise<DeletedFont[]> {
  const rows = await query<{
    id: number;
    name: string;
    file_name: string;
    visible: number;
    position: number;
    updated_at: Date;
  }>(
    `SELECT id, name, file_name, visible, position, updated_at
     FROM fonts
     WHERE is_deleted = 1
     ORDER BY updated_at DESC, id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    fileName: row.file_name,
    fileUrl: `/deleted/fonts/${row.file_name}`,
    visible: Boolean(row.visible),
    position: row.position,
    deletedAt: row.updated_at
  }));
}

export async function getDeletedColors(): Promise<DeletedColor[]> {
  const rows = await query<{
    id: number;
    name: string;
    value: string;
    visible: number;
    position: number;
    updated_at: Date;
  }>(
    `SELECT id, name, value, visible, position, updated_at
     FROM colors
     WHERE is_deleted = 1
     ORDER BY updated_at DESC, id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: row.value,
    visible: Boolean(row.visible),
    position: row.position,
    deletedAt: row.updated_at
  }));
}

export async function getDeletedExports(): Promise<DeletedExport[]> {
  const rows = await query<{
    id: number;
    session_id: string;
    export_id: string;
    project_hash: string;
    product: string;
    size_cm: number;
    font_id: number | null;
    font_name: string;
    color: string;
    client_name: string | null;
    client_contact: string | null;
    details_json: string | null;
    svg_path: string;
    dxf_path: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, session_id, export_id, project_hash, product, size_cm, font_id, font_name, color, client_name, client_contact, details_json, svg_path, dxf_path, created_at, updated_at
     FROM inscription_exports
     WHERE is_deleted = 1
     ORDER BY updated_at DESC, id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    exportId: row.export_id,
    projectHash: row.project_hash,
    product: row.product,
    sizeCm: row.size_cm,
    fontId: row.font_id,
    fontName: row.font_name,
    color: row.color,
    clientName: row.client_name ?? '',
    clientContact: row.client_contact ?? '',
    detailsJson: row.details_json ?? '',
    svgPath: row.svg_path,
    dxfPath: row.dxf_path,
    createdAt: row.created_at,
    deletedAt: row.updated_at
  }));
}
