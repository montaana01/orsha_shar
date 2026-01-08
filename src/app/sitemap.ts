import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { getPublicCategories } from '@/lib/public-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = ['', '/configurator', '/inscription', '/privacy'];
  const categories = await getPublicCategories();

  return [
    ...staticRoutes.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.6,
    })),
    ...categories.map((category) => ({
      url: `${site.url}/${category.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
