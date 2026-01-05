import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/data';
import { site, telHref } from '@/content/site';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const phone = site.contacts.phones[0];
  return (
    <div className="cards">
      {categories.map((category) => (
        <div key={category.slug} className="card">
          <Link href={`/${category.slug}`} className="card__link">
            <div className="card__media">
              <Image src={category.heroImage} alt={category.title} width={900} height={1000} className="card__img" sizes="(max-width: 900px) 100vw, 33vw" />
            </div>
            <div className="card__body">
              <h3 className="card__title">{category.title}</h3>
              <p className="card__desc">{category.description}</p>
            </div>
          </Link>
          {phone ? (
            <div className="card__actions">
              <a className="btn btn--secondary" href={telHref(phone)}>
                Позвонить
              </a>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
