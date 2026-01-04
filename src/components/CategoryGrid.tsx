import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/data';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="cards">
      {categories.map((category) => (
        <Link key={category.slug} href={`/${category.slug}`} className="card">
          <div className="card__media">
            <Image src={category.heroImage} alt={category.title} width={900} height={1000} className="card__img" sizes="(max-width: 900px) 100vw, 33vw" />
          </div>
          <div className="card__body">
            <h3 className="card__title">{category.title}</h3>
            <p className="card__desc">{category.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
