import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { site } from '@/content/site';
import { getCategoryImagesBySlug } from '@/lib/data';
import { getPublicCategoryBySlug } from '@/lib/public-data';
import { Button } from '@/components/Button';
import { Gallery } from '@/components/Gallery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { slug: string };
type Props = { params: Promise<Params> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);
  if (!category) return {};

  const url = `${site.url}/${category.slug}`;

  return {
    title: category.title,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      title: category.title,
      description: category.description,
      url,
      images: [{ url: category.heroImage }]
    }
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);
  if (!category || !category.visible) notFound();

  const images = await getCategoryImagesBySlug(category.slug).catch(() => []);
  const imageUrls = images.map((img) => img.url);

  return (
    <>
      <section className="pageHead">
        <div className="pageHead__inner">
          <div>
            <h1 className="pageHead__title">{category.title}</h1>
            <p className="pageHead__subtitle">{category.description}</p>
            <div className="pageHead__actions">
              <Button href={site.socials.instagramDm} external variant="primary">
                Заказать в Instagram
              </Button>
              {site.socials.telegram ? (
                <Button href={site.socials.telegram} external variant="secondary">
                  Заказать в Telegram
                </Button>
              ) : null}
              <Button href="/configurator" variant="ghost">
                Конфигуратор
              </Button>
            </div>
          </div>

          <div className="pageHead__media">
            <Image
              src={category.heroImage}
              alt={category.title}
              width={1200}
              height={900}
              className="pageHead__img"
              sizes="(max-width: 980px) 100vw, 520px"
            />
          </div>
        </div>
      </section>

      {imageUrls.length ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Фото</h2>
            <p className="section__subtitle">Примеры работ. Можно использовать как референсы при заказе.</p>
          </div>
          <Gallery images={imageUrls} altPrefix={category.title} />
        </section>
      ) : null}

      <section className="section">
        <div className="panel panel--service">
          <div>
            <h3 className="panel__title">Сформировать заявку</h3>
            <p className="muted">
              Конфигуратор поможет быстро собрать детали и сформирует текст, который вы отправите в мессенджер.
            </p>
          </div>
          <Button href={`/configurator?type=${category.slug}`} variant="primary">
            Перейти в конфигуратор
          </Button>
        </div>
      </section>
    </>
  );
}
