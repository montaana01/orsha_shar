import Link from 'next/link';
import { site, telHref } from '@/content/site';

export function Footer() {
  const [p1, p2] = site.contacts.phones;

  return (
    <footer className="footer" id="contacts">
      <div className="container footer__inner">
        <div className="footer__col">
          <h2 className="footer__title">Контакты</h2>
          <ul className="list">
            <li>
              <a href={telHref(p1)}>{formatPhone(p1)} (МТС)</a>
            </li>
            <li>
              <a href={telHref(p2)}>{formatPhone(p2)} (МТС)</a>
            </li>
            <li>
              <a href={`mailto:${site.contacts.email}`}>{site.contacts.email}</a>
            </li>
          </ul>
          <p className="muted">
            Бесплатная доставка по г. Орша и а.г. Бабиничи. По Оршанскому району — платная доставка.
          </p>
        </div>

        <div className="footer__col">
          <h2 className="footer__title">Соцсети</h2>
          <ul className="list">
            <li>
              <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href={site.socials.vk} target="_blank" rel="noopener noreferrer">
                VK
              </a>
            </li>
            <li>
              <a href={site.socials.ok} target="_blank" rel="noopener noreferrer">
                OK
              </a>
            </li>
            {site.socials.telegram ? (
              <li>
                <a href={site.socials.telegram} target="_blank" rel="noopener noreferrer">
                  Telegram @orshashar
                </a>
              </li>
            ) : null}
          </ul>

          <p className="muted">
            Сайт не хранит персональные данные — только технические cookies.
          </p>
        </div>

        <div className="footer__col">
          <h2 className="footer__title">Навигация</h2>
          <ul className="list">
            <li>
              <Link href="/">Главная</Link>
            </li>
            <li>
              <Link href="/configurator">Конфигуратор</Link>
            </li>
            <li>
              <Link href="/privacy">Политика cookies</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <span className="muted">© {new Date().getFullYear()} {site.legalName}</span>
      </div>
    </footer>
  );
}

function formatPhone(phone: string) {
  // +375297107027 -> +375 (29) 710-70-27
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('375')) {
    const cc = digits.slice(0, 3);
    const op = digits.slice(3, 5);
    const a = digits.slice(5, 8);
    const b = digits.slice(8, 10);
    const c = digits.slice(10, 12);
    return `+${cc} (${op}) ${a}-${b}-${c}`;
  }
  return phone;
}
