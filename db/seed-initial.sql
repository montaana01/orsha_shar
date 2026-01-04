-- Categories
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

-- Category images
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img01.webp', 1, 1 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img01.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img02.webp', 1, 2 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img02.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img03.webp', 1, 3 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img03.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 4 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img06.webp', 1, 5 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img06.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img07.webp', 1, 6 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img07.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img08.webp', 1, 7 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img08.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 8 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 9 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img12.webp', 1, 10 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img12.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img13.webp', 1, 11 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img13.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img14.webp', 1, 12 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img14.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img15.webp', 1, 13 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img15.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img18.webp', 1, 14 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img18.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img19.webp', 1, 15 FROM categories c WHERE c.slug = 'bouquets' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img19.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img01.webp', 1, 1 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img01.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 2 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img05.webp', 1, 3 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img05.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img06.webp', 1, 4 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img06.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img07.webp', 1, 5 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img07.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img08.webp', 1, 6 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img08.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 7 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 8 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img11.webp', 1, 9 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img11.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img12.webp', 1, 10 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img12.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img13.webp', 1, 11 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img13.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img16.webp', 1, 12 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img16.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img17.webp', 1, 13 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img17.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img18.webp', 1, 14 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img18.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img19.webp', 1, 15 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img19.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img20.webp', 1, 16 FROM categories c WHERE c.slug = 'boxes' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img20.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img01.webp', 1, 1 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img01.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img02.webp', 1, 2 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img02.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img03.webp', 1, 3 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img03.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 4 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img05.webp', 1, 5 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img05.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img06.webp', 1, 6 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img06.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img07.webp', 1, 7 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img07.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 8 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 9 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img11.webp', 1, 10 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img11.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img12.webp', 1, 11 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img12.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img13.webp', 1, 12 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img13.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img14.webp', 1, 13 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img14.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img15.webp', 1, 14 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img15.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img16.webp', 1, 15 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img16.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img17.webp', 1, 16 FROM categories c WHERE c.slug = 'bubbles' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img17.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img01.webp', 1, 1 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img01.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img02.webp', 1, 2 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img02.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img03.webp', 1, 3 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img03.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 4 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img05.webp', 1, 5 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img05.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img07.webp', 1, 6 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img07.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img08.webp', 1, 7 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img08.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 8 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 9 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img11.webp', 1, 10 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img11.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img12.webp', 1, 11 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img12.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img13.webp', 1, 12 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img13.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img14.webp', 1, 13 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img14.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img15.webp', 1, 14 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img15.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img16.webp', 1, 15 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img16.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img17.webp', 1, 16 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img17.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img18.webp', 1, 17 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img18.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img19.webp', 1, 18 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img19.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img20.webp', 1, 19 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img20.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img21.webp', 1, 20 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img21.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img22.webp', 1, 21 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img22.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img23.webp', 1, 22 FROM categories c WHERE c.slug = 'figures' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img23.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img01.webp', 1, 1 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img01.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img02.webp', 1, 2 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img02.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img03.webp', 1, 3 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img03.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 4 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img05.webp', 1, 5 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img05.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img06.webp', 1, 6 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img06.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img07.webp', 1, 7 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img07.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img08.webp', 1, 8 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img08.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 9 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 10 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img11.webp', 1, 11 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img11.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img13.webp', 1, 12 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img13.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img14.webp', 1, 13 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img14.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img15.webp', 1, 14 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img15.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img16.webp', 1, 15 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img16.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img17.webp', 1, 16 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img17.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img18.webp', 1, 17 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img18.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img19.webp', 1, 18 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img19.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img22.webp', 1, 19 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img22.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img23.webp', 1, 20 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img23.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img24.webp', 1, 21 FROM categories c WHERE c.slug = 'fountains' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img24.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img01.webp', 1, 1 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img01.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img02.webp', 1, 2 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img02.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img03.webp', 1, 3 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img03.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 4 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img05.webp', 1, 5 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img05.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img06.webp', 1, 6 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img06.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img07.webp', 1, 7 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img07.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img08.webp', 1, 8 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img08.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 9 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 10 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img11.webp', 1, 11 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img11.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img13.webp', 1, 12 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img13.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img14.webp', 1, 13 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img14.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img15.webp', 1, 14 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img15.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img16.webp', 1, 15 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img16.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img17.webp', 1, 16 FROM categories c WHERE c.slug = 'numerals' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img17.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img01.webp', 1, 1 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img01.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img02.webp', 1, 2 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img02.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img03.webp', 1, 3 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img03.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 4 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img05.webp', 1, 5 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img05.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img06.webp', 1, 6 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img06.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img07.webp', 1, 7 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img07.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img08.webp', 1, 8 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img08.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 9 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 10 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img11.webp', 1, 11 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img11.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img12.webp', 1, 12 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img12.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img14.webp', 1, 13 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img14.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img15.webp', 1, 14 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img15.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img16.webp', 1, 15 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img16.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img17.webp', 1, 16 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img17.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img18.webp', 1, 17 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img18.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img19.webp', 1, 18 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img19.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img20.webp', 1, 19 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img20.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img021.webp', 1, 20 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img021.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img21.webp', 1, 21 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img21.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img22.webp', 1, 22 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img22.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img23.webp', 1, 23 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img23.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img24.webp', 1, 24 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img24.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img25.webp', 1, 25 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img25.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img051.webp', 1, 26 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img051.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img071.webp', 1, 27 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img071.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img091.webp', 1, 28 FROM categories c WHERE c.slug = 'photozony' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img091.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img02.webp', 1, 1 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img02.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img03.webp', 1, 2 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img03.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img04.webp', 1, 3 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img04.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img05.webp', 1, 4 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img05.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img06.webp', 1, 5 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img06.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img08.webp', 1, 6 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img08.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img09.webp', 1, 7 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img09.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img10.webp', 1, 8 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img10.webp');
INSERT INTO category_images (category_id, file_name, visible, position) SELECT c.id, 'img11.webp', 1, 9 FROM categories c WHERE c.slug = 'tematicheskiye' AND c.is_deleted = 0 AND NOT EXISTS (SELECT 1 FROM category_images i WHERE i.category_id = c.id AND i.file_name = 'img11.webp');

-- Fonts
UPDATE fonts SET name = 'Arctika Script', visible = 1, position = 0, is_deleted = 0 WHERE file_name = 'Arctika_script.ttf';
INSERT INTO fonts (name, file_name, visible, position)
SELECT 'Arctika Script', 'Arctika_script.ttf', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM fonts WHERE file_name = 'Arctika_script.ttf');

UPDATE fonts SET name = 'Bad Script', visible = 1, position = 1, is_deleted = 0 WHERE file_name = 'Bad_Script.ttf';
INSERT INTO fonts (name, file_name, visible, position)
SELECT 'Bad Script', 'Bad_Script.ttf', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM fonts WHERE file_name = 'Bad_Script.ttf');

UPDATE fonts SET name = 'Bodega Script', visible = 1, position = 2, is_deleted = 0 WHERE file_name = 'Bodega Script.ttf';
INSERT INTO fonts (name, file_name, visible, position)
SELECT 'Bodega Script', 'Bodega Script.ttf', 1, 2
WHERE NOT EXISTS (SELECT 1 FROM fonts WHERE file_name = 'Bodega Script.ttf');

UPDATE fonts SET name = 'Corinthia', visible = 1, position = 3, is_deleted = 0 WHERE file_name = 'Corinthia.ttf';
INSERT INTO fonts (name, file_name, visible, position)
SELECT 'Corinthia', 'Corinthia.ttf', 1, 3
WHERE NOT EXISTS (SELECT 1 FROM fonts WHERE file_name = 'Corinthia.ttf');

UPDATE fonts SET name = 'Katherine', visible = 1, position = 4, is_deleted = 0 WHERE file_name = 'katherine.ttf';
INSERT INTO fonts (name, file_name, visible, position)
SELECT 'Katherine', 'katherine.ttf', 1, 4
WHERE NOT EXISTS (SELECT 1 FROM fonts WHERE file_name = 'katherine.ttf');

-- Colors
UPDATE colors SET name = 'Белый', value = '#FFFFFF', visible = 1, position = 0, is_deleted = 0 WHERE value = '#FFFFFF';
INSERT INTO colors (name, value, visible, position)
SELECT 'Белый', '#FFFFFF', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#FFFFFF');

UPDATE colors SET name = 'Чёрный', value = '#111111', visible = 1, position = 1, is_deleted = 0 WHERE value = '#111111';
INSERT INTO colors (name, value, visible, position)
SELECT 'Чёрный', '#111111', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#111111');

UPDATE colors SET name = 'Золото', value = '#C9A227', visible = 1, position = 2, is_deleted = 0 WHERE value = '#C9A227';
INSERT INTO colors (name, value, visible, position)
SELECT 'Золото', '#C9A227', 1, 2
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#C9A227');

UPDATE colors SET name = 'Серебро', value = '#C6CBD4', visible = 1, position = 3, is_deleted = 0 WHERE value = '#C6CBD4';
INSERT INTO colors (name, value, visible, position)
SELECT 'Серебро', '#C6CBD4', 1, 3
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#C6CBD4');

UPDATE colors SET name = 'Розовое золото', value = '#C48C86', visible = 1, position = 4, is_deleted = 0 WHERE value = '#C48C86';
INSERT INTO colors (name, value, visible, position)
SELECT 'Розовое золото', '#C48C86', 1, 4
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#C48C86');

UPDATE colors SET name = 'Красный', value = '#D22B2B', visible = 1, position = 5, is_deleted = 0 WHERE value = '#D22B2B';
INSERT INTO colors (name, value, visible, position)
SELECT 'Красный', '#D22B2B', 1, 5
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#D22B2B');

UPDATE colors SET name = 'Синий', value = '#2B5BD2', visible = 1, position = 6, is_deleted = 0 WHERE value = '#2B5BD2';
INSERT INTO colors (name, value, visible, position)
SELECT 'Синий', '#2B5BD2', 1, 6
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#2B5BD2');

UPDATE colors SET name = 'Розовый', value = '#E45B9B', visible = 1, position = 7, is_deleted = 0 WHERE value = '#E45B9B';
INSERT INTO colors (name, value, visible, position)
SELECT 'Розовый', '#E45B9B', 1, 7
WHERE NOT EXISTS (SELECT 1 FROM colors WHERE value = '#E45B9B');
