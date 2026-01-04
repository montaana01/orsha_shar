'use client';

import { useMemo, useState } from 'react';
import { categories, categoryBySlug, type CategorySlug } from '@/content/categories';
import { site } from '@/content/site';

type RequestType = CategorySlug | 'other';

export function ConfiguratorClient({ initialType }: { initialType: string | undefined }) {
  const normalizedInitial: RequestType = (categories.some((c) => c.slug === initialType) ? (initialType as CategorySlug) : 'other');
  const [type, setType] = useState<RequestType>(normalizedInitial);
  const [occasion, setOccasion] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('Орша');
  const [budget, setBudget] = useState('');
  const [colors, setColors] = useState('');
  const [notes, setNotes] = useState('');

  const typeLabel = useMemo(() => {
    if (type === 'other') return 'Другое';
    return categoryBySlug(type)?.title ?? type;
  }, [type]);

  const requestText = useMemo(() => {
    const lines: string[] = [];
    lines.push('Заявка с сайта ORSHA SHAR');
    lines.push(`Категория: ${typeLabel}`);
    if (occasion) lines.push(`Повод/событие: ${occasion}`);
    if (date) lines.push(`Дата/время: ${date}`);
    if (location) lines.push(`Адрес/локация: ${location}`);
    if (colors) lines.push(`Цвета/стиль: ${colors}`);
    if (budget) lines.push(`Бюджет: ${budget}`);
    if (notes) lines.push(`Комментарий: ${notes}`);
    lines.push('Контакт для связи: (укажите ваш телефон/ник)');
    return lines.join('\n');
  }, [typeLabel, occasion, date, location, colors, budget, notes]);

  const telegramShare = useMemo(() => {
    const base = 'https://t.me/orshashar';
    const url = new URL(base);
    url.searchParams.set('url', site.url);
    url.searchParams.set('text', requestText);
    return url.toString();
  }, [requestText]);

  async function copy() {
    await navigator.clipboard.writeText(requestText);
    alert('Текст заявки скопирован.');
  }

  return (
    <div className="configurator">
      <div className="panel">
        <h1 className="section__title" style={{ marginTop: 0 }}>
          Конфигуратор заявки
        </h1>
        <p className="muted">
          Заполните поля — ниже появится текст заявки. Ничего не сохраняется на сервере.
        </p>

        <div className="form">
          <label className="field">
            <span className="field__label">Категория</span>
            <select className="field__control" value={type} onChange={(event) => setType(event.target.value as RequestType)}>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.title}
                </option>
              ))}
              <option value="other">Другое</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">Повод / событие</span>
            <input className="field__control" value={occasion} onChange={(event) => setOccasion(event.target.value)} placeholder="День рождения, свадьба, выписка из роддома..." />
          </label>

          <label className="field">
            <span className="field__label">Дата / время</span>
            <input className="field__control" value={date} onChange={(event) => setDate(event.target.value)} placeholder="Например: 10 января, к 18:00" />
          </label>

          <label className="field">
            <span className="field__label">Адрес / локация</span>
            <input className="field__control" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Орша, ..." />
          </label>

          <label className="field">
            <span className="field__label">Цвета / стиль</span>
            <input className="field__control" value={colors} onChange={(event) => setColors(event.target.value)} placeholder="Белый+золото, пастель, гендер-пати..." />
          </label>

          <label className="field">
            <span className="field__label">Бюджет</span>
            <input className="field__control" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Например: до 100 BYN" />
          </label>

          <label className="field field--full">
            <span className="field__label">Комментарий</span>
            <textarea className="field__control" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Размеры, надпись, наполнение, пожелания..." />
          </label>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel__title">Текст заявки</h2>
        <pre className="pre">{requestText}</pre>
        <div className="hero__actions">
          <button className="btn btn--primary" onClick={copy} type="button">
            Скопировать
          </button>
          <a className="btn btn--secondary" href={telegramShare} target="_blank" rel="noopener noreferrer">
            Написать в Telegram
          </a>
          <a className="btn btn--ghost" href={site.socials.instagramDm} target="_blank" rel="noopener noreferrer">
            Написать в Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
