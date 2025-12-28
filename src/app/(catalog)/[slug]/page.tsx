import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { categories, categoryBySlug, type CategorySlug } from '@/content/categories';
import { site } from '@/content/site';
import { listGalleryImages } from '@/lib/gallery';
import { Button } from '@/components/Button';
import { Gallery } from '@/components/Gallery';

type Props = { params: { slug: string } };

export function generateStaticParams(): Array<{ slug: CategorySlug }> {
  return categories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const category = categoryBySlug(params.slug);
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

export default function CategoryPage({ params }: Props) {
  const category = categoryBySlug(params.slug);
  if (!category) notFound();

  const images = listGalleryImages(category.slug);

  return (
    <>
      <section className="pageHead">
        <div className="pageHead__inner">
          <div>
            <h1 className="pageHead__title">{category.title}</h1>
            <p className="pageHead__subtitle">{category.description}</p>
            <div className="pageHead__actions">
              <Button href={site.socials.instagram} external variant="primary">
                Заказать в Instagram
              </Button>
              {site.socials.telegram ? (
                <Button href={site.socials.telegram} external variant="secondary">
                  Заказать в Telegram
                </Button>
              ) : null}
              <Button href="/constructor" variant="ghost">
                Конструктор
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

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Фото</h2>
          <p className="section__subtitle">Примеры работ. Можно использовать как референсы при заказе.</p>
        </div>
        <Gallery images={images} altPrefix={category.title} />
      </section>

      <section className="section">
        <div className="panel panel--cta">
          <div>
            <h3 className="panel__title">Сформировать заявку</h3>
            <p className="muted">
              Конструктор поможет быстро собрать детали и сформирует текст, который вы отправите в мессенджер.
            </p>
          </div>
          <Button href={`/constructor?type=${category.slug}`} variant="primary">
            Перейти в конструктор
          </Button>
        </div>
      </section>
    </>
  );
}
