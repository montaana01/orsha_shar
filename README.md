# ORSHA SHAR — Next.js (React) SSR/SSG сайт-витрина с галереями и SEO

Современная замена старого билда на Tilda: быстрый SEO-дружественный сайт-витрина для услуг оформления шарами (Орша) с галереями по категориям и “конфигуратором заявки” без хранения данных.

## Содержание

- [Ключевые возможности](#ключевые-возможности)
- [Стек](#стек)
- [Быстрый старт](#быстрый-старт)
- [Контент и галереи](#контент-и-галереи)
- [SEO](#seo)
- [Деплой на VPS](#деплой-на-vps)
- [Структура проекта](#структура-проекта)
- [Политика данных](#политика-данных)
- [Поддержка](#поддержка)

---

## Ключевые возможности

- **SSR/SSG (Next.js App Router)** для корректного SEO и высокой скорости.
- **Каталог категорий**: отдельная SEO-страница для каждой категории (`/<slug>`).
- **Галереи работ**: изображения лежат в `public/gallery/<slug>/…`, страницы подтягивают их автоматически.
- **Конфигуратор заявки** `/configurator`:
  - генерирует текст заявки на клиенте,
  - позволяет копировать и “поделиться в Telegram”,
  - **не отправляет данные на сервер**.
- **Красивый хедер** с брендингом и компактной навигацией (каталог в dropdown).
- **SEO инфраструктура**: `sitemap.xml`, `robots.txt`, OpenGraph, метаданные.
- **Редиректы со старых Tilda URL** (`pageXXXX.html`) на новые маршруты, чтобы не терять индексацию.

---

## Стек

- Next.js **14.2.35**
- React **18**
- TypeScript
- ESLint + `eslint-config-next` (совместимые версии закреплены)
- Шрифты через `next/font`:
  - Inter (UI)
  - Cormorant Garamond (заголовки)

---

## Быстрый старт

### Требования

- Node.js (рекомендуется актуальная LTS-версия, например Node 20)
- npm

### Установка

```bash
npm install
npm run dev
```

## Переменные окружения

Создайте `.env`:

```bash
NEXT_PUBLIC_SITE_URL=https://orsha-shar.by
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/<ваш_username>
```

## Продакшн

```bash
npm run build
npm run start
```

## Контент

- Контакты/соцсети: `src/content/site.ts`
- Категории и описания: `src/content/categories.ts`
- Галереи подтягиваются из `public/gallery/<slug>/...` автоматически (`src/lib/gallery.ts`)

## Качество кода (ESLint / Prettier / Husky / Commitlint)

### Команды

```bash
NEXT_PUBLIC_SITE_URL=https://orsha-shar.by
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/orshashar
```

> `NEXT_PUBLIC_TELEGRAM_URL` ориентирован на аккаунт `@orshashar`.  
> `NEXT_PUBLIC_SITE_URL` важен для sitemap и OpenGraph.

---

## Контент и галереи

### Категории

Категории описываются в:

- `src/content/categories.ts`

Каждая категория содержит:

- `slug` (URL сегмент),
- `title`,
- `description`,
- (опционально) `heroImage`.

### Как добавить/обновить фото в галерее

1. Положите изображения в папку:
   - `public/gallery/<slug>/`
   Пример:
   - `public/gallery/photozony/001.jpg`
   - `public/gallery/photozony/002.jpg`

2. Обновите страницу в браузере — галерея подтянет файлы автоматически.

Рекомендации по изображениям:

- используйте `.jpg`/`.jpeg` для фото, `.png` для графики,
- давайте понятные имена (`001.jpg`, `002.jpg`), чтобы сортировка была стабильной.

---

## SEO

Проект включает:

- `sitemap.xml` (генерируется приложением),
- `robots.txt`,
- `metadata` и OpenGraph в `src/app/layout.tsx`,
- редиректы старых Tilda URL в `next.config.mjs`.

### Редиректы

Если у вас есть дополнительные старые страницы с Tilda (`pageXXXX.html`), добавляйте их в:

- `next.config.mjs` → `redirects()`.

---

## Деплой на VPS

Ниже — практичный вариант: Node + Nginx reverse proxy.

### 1) Установить зависимости и собрать

```bash
npm install
npm run build
```

### 2) Запуск через PM2 (рекомендуется)

```bash
npm i -g pm2
pm2 start npm --name "orsha-shar" -- start
pm2 save
pm2 startup
```

### 3) Nginx (пример)

```nginx
server {
  listen 80;
  server_name orsha-shar.by www.orsha-shar.by;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Далее подключите HTTPS (Let’s Encrypt / Certbot) стандартным способом.

---

## Структура проекта

Ключевые пути:

- `src/app/`
  - `page.tsx` — главная
  - `/(catalog)/[slug]/page.tsx` — страницы категорий
  - `/configurator/page.tsx` — конфигуратор заявки (клиентский UI)
  - `/privacy/page.tsx` — политика cookies
  - `robots.ts`, `sitemap.ts` — SEO файлы
- `src/components/` — компоненты UI (Header/Footer/Gallery/Buttons и др.)
- `src/content/`
  - `site.ts` — бренд, контакты, ссылки
  - `categories.ts` — категории
- `src/lib/` — утилиты (галерея/сортировка/помощники)
- `public/gallery/` — изображения по категориям
- `public/assets/` — логотипы/иконки/статические изображения

---

## Политика данных

- Сайт не хранит заявки и не использует серверные формы.
- Коммуникация и приём заказов — через Telegram/Instagram.
- Конфигуратор `/configurator` генерирует текст и помогает передать его в мессенджер, без отправки данных на сервер.
- По умолчанию аналитика и трекеры не подключены.

---

## Поддержка

Если нужно:

- добавить новые категории,
- улучшить структуру страниц под SEO (FAQ/тексты),
- сделать лайтбокс/просмотр фото,
- довести стиль до “максимально Apple/Google” (типографика, ритм, микро-анимации),

смотрите конфиги в `src/content/*` и структуру `public/gallery/*`.
