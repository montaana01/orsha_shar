export type CategorySlug =
  | 'photozony'
  | 'fountains'
  | 'boxes'
  | 'bouquets'
  | 'figures'
  | 'numerals'
  | 'tematicheskiye'
  | 'bubbles';

export type Category = {
  slug: CategorySlug;
  title: string;
  description: string;
  heroImage: string;
};

export const categories: Category[] = [
  {
    slug: 'photozony',
    title: 'Фотозоны',
    description: 'Наша команда реализует самые различные варианты фотозон.',
    heroImage: '/gallery/photozony/img01.jpg'
  },
  {
    slug: 'fountains',
    title: 'Фонтаны из шаров',
    description: 'Мы предлагаем различные варианты фонтанов из шаров.',
    heroImage: '/gallery/fountains/img01.jpg'
  },
  {
    slug: 'boxes',
    title: 'Коробка сюрприз',
    description:
      'Такая коробка станет отличным сюрпризом: помещается в машине, легко проходит в дверной проём, а кроме шаров внутрь можно положить подарок.',
    heroImage: '/gallery/boxes/img01.webp'
  },
  {
    slug: 'bouquets',
    title: 'Букеты из шаров',
    description: 'Букет цветов — прекрасный подарок или дополнение к основному подарку.',
    heroImage: '/gallery/bouquets/img01.jpg'
  },
  {
    slug: 'figures',
    title: 'Фигуры из шаров',
    description: 'Наша команда изготовит фигуры из шаров любой сложности.',
    heroImage: '/gallery/figures/img01.jpg'
  },
  {
    slug: 'numerals',
    title: 'Цифры',
    description: 'Если именинник забыл сколько ему лет — можно оригинально напомнить!',
    heroImage: '/gallery/numerals/img01.jpg'
  },
  {
    slug: 'tematicheskiye',
    title: 'Тематические украшения',
    description:
      'Украшение свадеб, выпускных, линеек. Подарки на дни рождения и юбилеи. Оформление выписки из роддома.',
    heroImage: '/gallery/tematicheskiye/img01.webp'
  },
  {
    slug: 'bubbles',
    title: 'Шары Bubbles',
    description: 'Шар Bubbles — стильный шар-гигант с надписью и наполнением.',
    heroImage: '/gallery/bubbles/img01.webp'
  }
];

export function categoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
