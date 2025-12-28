'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import { categories } from '@/content/categories';
import { site } from '@/content/site';

type NavItem = { href: string; label: string };

export function Header() {
  const pathname = usePathname();
  const catalogRef = useRef<HTMLDetailsElement | null>(null);
  const mobileRef = useRef<HTMLDetailsElement | null>(null);

  const navItems: NavItem[] = useMemo(
    () => [
      ...categories.map((c) => ({ href: `/${c.slug}`, label: c.title })),
      { href: '/constructor', label: 'Конструктор' }
    ],
    []
  );

  const closeMenus = () => {
    if (catalogRef.current) catalogRef.current.open = false;
    if (mobileRef.current) mobileRef.current.open = false;
  };

  useEffect(() => {
    closeMenus();
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="header">
      <div className="container header__inner">
        <Link href="/" className="header__brand" aria-label={`${site.name} — главная`}>
          <span className="header__mark" aria-hidden="true">
            <Image src="/assets/logo.png" alt="" width={36} height={36} priority />
          </span>
          <span className="header__brandText">
            <span className="header__brandName">{site.name}</span>
            <span className="header__brandTag">Шары • фотозоны • декор</span>
          </span>
        </Link>

        <nav className="nav nav--desktop" aria-label="Основная навигация">
          <details className="nav__dropdown" ref={catalogRef}>
            <summary className="nav__link nav__link--summary" aria-label="Открыть каталог" role="button">
              Каталог
              <span className="nav__caret" aria-hidden="true" />
            </summary>

            <div className="nav__popover" role="menu" aria-label="Каталог">
              <div className="nav__popoverHead">
                <span className="nav__popoverTitle">Категории</span>
                <Link href="/" className="nav__popoverHint" onClick={closeMenus}>
                  Смотреть всё
                </Link>
              </div>

              <div className="nav__grid">
                {categories.map((c) => {
                  const href = `/${c.slug}`;
                  const active = isActive(href);
                  return (
                    <Link
                      key={c.slug}
                      href={href}
                      className={`nav__item ${active ? 'nav__item--active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMenus}
                    >
                      <span className="nav__itemTitle">{c.title}</span>
                      <span className="nav__itemMeta">Галерея</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </details>

          <Link
            href="/constructor"
            className={`nav__link ${isActive('/constructor') ? 'nav__link--active' : ''}`}
            aria-current={isActive('/constructor') ? 'page' : undefined}
          >
            Конструктор
          </Link>

          <a className="nav__link nav__link--cta" href={site.socials.telegram} target="_blank" rel="noopener noreferrer">
            Telegram
          </a>

          <a className="nav__link" href="#contacts" onClick={closeMenus}>
            Контакты
          </a>
        </nav>

        <details className="nav nav--mobile" ref={mobileRef}>
          <summary className="nav__burger" aria-label="Открыть меню">
            <span />
            <span />
            <span />
          </summary>

          <div className="nav__panel" role="menu" aria-label="Меню">
            <div className="nav__panelHead">
              <span className="nav__panelTitle">Меню</span>
              <a
                className="nav__panelCta"
                href={site.socials.telegram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenus}
              >
                Написать в Telegram
              </a>
            </div>

            <div className="nav__panelGrid">
              {navItems.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`nav__panelLink ${active ? 'nav__panelLink--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    prefetch={false}
                    onClick={closeMenus}
                  >
                    {it.label}
                  </Link>
                );
              })}
              <a href="#contacts" className="nav__panelLink" onClick={closeMenus}>
                Контакты
              </a>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
