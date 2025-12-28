import Image from 'next/image';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Button } from '@/components/Button';
import { categories } from '@/content/categories';
import { site, telHref } from '@/content/site';

export default function HomePage() {
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
              Доставка по г. Орша — бесплатно. Заказ можно оформить в Instagram/Telegram.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href={telHref(phone)}>
                Позвонить
              </a>
              <Button href={site.socials.instagram} external variant="secondary">
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
                className="hero__img"
                sizes="(max-width: 980px) 100vw, 1120px"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="section">
        <div className="section__head">
          <h2 className="section__title">Категории</h2>
          <p className="section__subtitle">Выберите категорию — на странице будут фото и краткое описание.</p>
        </div>
        <CategoryGrid categories={categories} />
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
            <p className="muted">Бесплатно по Орше и Бабиничам. По району — платно.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Конструктор</h2>
          <p className="section__subtitle">
            Хотите быстрее согласовать заказ? Используйте конструктор: он сформирует текст заявки, который можно сразу отправить.
          </p>
        </div>
        <div className="panel panel--cta">
          <div>
            <h3 className="panel__title">Конструктор фотозон и фонтанов</h3>
            <p className="muted">Без регистрации и без хранения данных — только генерация заявки.</p>
          </div>
          <Button href="/constructor" variant="primary">
            Открыть конструктор
          </Button>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
