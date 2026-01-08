INSERT INTO categories (slug, title, description, hero_image, visible, position)
VALUES
  ('photozony', 'Фотозоны', 'Наша команда реализует самые различные варианты фотозон.', '/gallery/photozony/hero.webp', 1, 0),
  ('fountains', 'Фонтаны из шаров', 'Мы предлагаем различные варианты фонтанов из шаров.', '/gallery/fountains/hero.webp', 1, 1),
  (
    'boxes',
    'Коробка сюрприз',
    'Такая коробка станет отличным сюрпризом: помещается в машине, легко проходит в дверной проём, а кроме шаров внутрь можно положить подарок.',
    '/gallery/boxes/hero.webp',
    1,
    2
  ),
  ('bouquets', 'Букеты из шаров', 'Букет цветов — прекрасный подарок или дополнение к основному подарку.', '/gallery/bouquets/hero.webp', 1, 3),
  ('figures', 'Фигуры из шаров', 'Наша команда изготовит фигуры из шаров любой сложности.', '/gallery/figures/hero.webp', 1, 4),
  ('numerals', 'Цифры', 'Если именинник забыл сколько ему лет — можно оригинально напомнить!', '/gallery/numerals/hero.webp', 1, 5),
  (
    'tematicheskiye',
    'Тематические украшения',
    'Украшение свадеб, выпускных, линеек. Подарки на дни рождения и юбилеи. Оформление выписки из роддома.',
    '/gallery/tematicheskiye/hero.webp',
    1,
    6
  ),
  ('bubbles', 'Шары Bubbles', 'Шар Bubbles — стильный шар-гигант с надписью и наполнением.', '/gallery/bubbles/hero.webp', 1, 7)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  hero_image = VALUES(hero_image),
  visible = VALUES(visible),
  position = VALUES(position),
  is_deleted = 0;
