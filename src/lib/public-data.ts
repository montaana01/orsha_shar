import { categories as fallbackCategories } from '@/content/categories';
import type { Category } from './data';
import { getCategories, getCategoryBySlug } from './data';

const fallbackMapped: Category[] = fallbackCategories.map((category, index) => ({
  id: index + 1,
  slug: category.slug,
  title: category.title,
  description: category.description,
  heroImage: category.heroImage,
  visible: true,
  position: index
}));

export async function getPublicCategories(opts: { allowFallback?: boolean } = {}): Promise<Category[]> {
  const { allowFallback = true } = opts;
  const visible = await getCategories().catch(() => null);
  if (visible && visible.length) return visible;

  const any = await getCategories({ includeHidden: true }).catch(() => null);
  if (any && any.length) return visible ?? [];

  if (!allowFallback) return [];
  return fallbackMapped;
}

export async function getPublicCategoryBySlug(slug: string): Promise<Category | null> {
  const fromDb = await getCategoryBySlug(slug).catch(() => null);
  if (fromDb) return fromDb;

  const any = await getCategories({ includeHidden: true }).catch(() => null);
  if (any && any.length) return null;

  return fallbackMapped.find((category) => category.slug === slug) ?? null;
}
