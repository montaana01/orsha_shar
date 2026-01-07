import Image from 'next/image';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Button } from '@/components/Button';
import { categories as fallbackCategories } from '@/content/categories';
import { site, telHref } from '@/content/site';
import { getPublicCategories } from '@/lib/public-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function HomePage() {
  const categories = await getPublicCategories({ allowFallback: false });
  const showFallback = categories.length === 0;
  const fallbackGallery = fallbackCategories.map((category) => category.heroImage);
  const phone = site.contacts.phones[0];
  const hasTelegram = Boolean(site.socials.telegram);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.legalName,
    url: site.url,
    telephone: site.contacts.phones,
    email: site.contacts.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressCountry: site.country
    },
    sameAs: [site.socials.instagram, site.socials.vk, site.socials.ok].filter(Boolean)
  };

  return (
    <>
      <section className="hero">
        <div className="hero__panel">
          <div className="hero__inner">
            <h1 className="hero__title">Гелиевые шары и фотозоны в Орше</h1>
            <p className="hero__subtitle">
              Заказ можно оформить в Instagram/Telegram.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href={telHref(phone)}>
                Позвонить
              </a>
              <Button href={site.socials.instagramDm} external variant="secondary">
                Написать в Instagram
              </Button>
              {hasTelegram ? (
                <Button href={site.socials.telegram} external variant="secondary">
                  Написать в Telegram
                </Button>
              ) : null}
              <Button href="#catalog" variant="ghost">
                Каталог
              </Button>
            </div>

            <div className="hero__media">
              <Image
                src="/assets/hero-desk.webp"
                alt="Примеры работ ORSHA SHAR"
                width={1400}
                height={1000}
                priority
                fetchPriority="high"
                className="hero__img"
                sizes="(max-width: 980px) 100vw, 532px"
                quality={70}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="section">
        {showFallback ? (
          <>
            <div className="section__head">
              <h2 className="section__title">Оформление праздников</h2>
              <p className="section__subtitle">Под ключ или отдельные композиции — подберем вариант под ваш повод.</p>
            </div>

            <div className="fallbackGrid">
              <div className="panel">
                <p>
                  Хотите праздник, который выглядит красиво вживую и идеально на фото? Мы делаем оформление «под ключ» и отдельные
                  композиции — от небольшого сюрприза до полноценной фотозоны.
                </p>
                <p className="muted">Посмотрите наши работы в галерее и выберите стиль, который нравится именно вам.</p>
              </div>

              <div className="panel">
                <h3 className="panel__title">Что можно заказать у нас</h3>
                <ul className="featureList">
                  <li>Фотозоны — пайетки, шары, индивидуальные баннеры</li>
                  <li>Фонтаны из шаров — латекс/фольга, сердца, звёзды, цифры и другое</li>
                  <li>Коробка-сюрприз — шары + можно положить подарок, любой текст на коробке</li>
                  <li>Букеты из шаров — аккуратный и необычный подарок</li>
                  <li>Фигуры из шаров — любая сложность, можем повторить по референсу из интернета</li>
                  <li>Цифры — стильный акцент для дня рождения/юбилея</li>
                  <li>Тематические украшения — свадьбы, выпускные, линейки, выписка из роддома</li>
                  <li>Шары Bubbles — шар-гигант с надписью и наполнением</li>
                </ul>
              </div>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3 className="panel__title">Как сделать заказ</h3>
              <ol className="stepsList">
                <li>Напишите нам дату, район, что нужно, желаемые цвета и бюджет</li>
                <li>Согласуем детали: размер, надписи, наполнение, время и адрес</li>
                <li>Мы доставим Ваш заказ</li>
              </ol>
            </div>

            <div className="carousel" role="list" aria-label="Примеры работ">
              {fallbackGallery.map((src, idx) => (
                <div key={src} className="carousel__item" role="listitem">
                  <Image
                    src={src}
                    alt={`Пример работы ${idx + 1}`}
                    width={900}
                    height={1200}
                    className="carousel__img"
                    sizes="(max-width: 680px) 80vw, (max-width: 1100px) 40vw, 28vw"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="section__head">
              <h2 className="section__title">Категории</h2>
              <p className="section__subtitle">Выберите категорию — на странице будут фото и краткое описание.</p>
            </div>
            <CategoryGrid categories={categories} />
          </>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Как сделать заказ</h2>
          <p className="section__subtitle">
            Напишите в Instagram/Telegram: дата, город/район, что нужно, желаемые цвета и бюджет. Мы предложим варианты.
          </p>
        </div>
        <div className="grid">
          <div className="panel">
            <h3 className="panel__title">1. Выберите идею</h3>
            <p className="muted">Посмотрите примеры в каталоге и сохраните понравившиеся фотографии.</p>
          </div>
          <div className="panel">
            <h3 className="panel__title">2. Согласуем детали</h3>
            <p className="muted">Цвета, размер, надписи, наполнение, время и адрес доставки.</p>
          </div>
          <div className="panel">
            <h3 className="panel__title">3. Доставим</h3>
            <p className="muted">В пределах Орши и Бабинич в зависимости от суммы заказа. По району — платно.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Полезные сервисы</h2>
          <p className="section__subtitle">
            Инструменты для клиентов: заявка для быстрого заказа и конструктор надписи для макета.
          </p>
        </div>
        <div className="grid">
          <div className="panel panel--service">
            <h3 className="panel__title">Заявка</h3>
            <p className="muted">Сформирует текст заявки для быстрого взаимодействия.</p>
            <div className="hero__actions" style={{ marginTop: 12 }}>
              <Button href="/configurator" variant="primary">
                Открыть заявку
              </Button>
            </div>
          </div>
          <div className="panel panel--service">
            <h3 className="panel__title">Конструктор надписи</h3>
            <p className="muted">Соберите надпись для шара, звезды, сердца, круга (фольга) или bubble и скачайте превью.</p>
            <div className="hero__actions" style={{ marginTop: 12 }}>
              <Button href="/inscription" variant="secondary">
                Открыть конструктор
              </Button>
            </div>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
