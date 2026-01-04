'use client';

import { useMemo, useState } from 'react';
import type { Category } from '@/lib/data';
import { site } from '@/content/site';

type RequestType = string | 'other';

export function ConfiguratorClient({ initialType, categories }: { initialType: string | undefined; categories: Category[] }) {
  const normalizedInitial: RequestType = categories.some((c) => c.slug === initialType) ? (initialType as RequestType) : 'other';
  const [type, setType] = useState<RequestType>(normalizedInitial);
  const [occasion, setOccasion] = useState('');
  const [date, setDate] = useState('');
  const [timeMode, setTimeMode] = useState<'exact' | 'range'>('exact');
  const [timeExact, setTimeExact] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [location, setLocation] = useState('Орша');
  const [budget, setBudget] = useState('');
  const [colors, setColors] = useState('');
  const [notes, setNotes] = useState('');

  const requiredStatus = useMemo(() => {
    const missing: string[] = [];
    if (!occasion.trim()) missing.push('Событие');
    if (!date) missing.push('Дата');
    if (timeMode === 'exact') {
      if (!timeExact) missing.push('Время');
    } else {
      if (!timeFrom) missing.push('Время: с');
      if (!timeTo) missing.push('Время: до');
    }
    if (!location.trim()) missing.push('Адрес');
    if (!colors.trim()) missing.push('Цвета');
    if (!budget.trim()) missing.push('Бюджет');
    return { missing, ready: missing.length === 0 };
  }, [budget, colors, date, location, timeExact, timeFrom, timeMode, timeTo]);

  const typeLabel = useMemo(() => {
    if (type === 'other') return 'Другое';
    return categories.find((category) => category.slug === type)?.title ?? type;
  }, [categories, type]);

  const formattedDate = useMemo(() => {
    if (!date) return '';
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString('ru-RU');
  }, [date]);

  const timeLabel = useMemo(() => {
    if (timeMode === 'exact') {
      return timeExact ? `к ${timeExact}` : '';
    }
    if (timeFrom && timeTo) return `с ${timeFrom} до ${timeTo}`;
    if (timeFrom) return `с ${timeFrom}`;
    if (timeTo) return `до ${timeTo}`;
    return '';
  }, [timeExact, timeFrom, timeMode, timeTo]);

  const requestText = useMemo(() => {
    const lines: string[] = [];
    lines.push('Заявка с сайта ORSHA SHAR');
    lines.push(`Категория: ${typeLabel}`);
    if (occasion) lines.push(`Событие/повод: ${occasion}`);
    if (formattedDate || timeLabel) {
      const parts = [formattedDate, timeLabel].filter(Boolean).join(', ');
      lines.push(`Дата/время: ${parts}`);
    }
    if (location) lines.push(`Адрес/локация: ${location}`);
    if (colors) lines.push(`Цвета/стиль: ${colors}`);
    if (budget) lines.push(`Бюджет: ${budget}`);
    if (notes) lines.push(`Комментарий: ${notes}`);
    lines.push('Контакт для связи: (укажите ваш телефон/ник)');
    return lines.join('\n');
  }, [typeLabel, occasion, formattedDate, timeLabel, location, colors, budget, notes]);

  const telegramShare = useMemo(() => {
    const base = 'https://t.me/orshashar';
    const url = new URL(base);
    url.searchParams.set('url', site.url);
    url.searchParams.set('text', requestText);
    return url.toString();
  }, [requestText]);

  async function copy() {
    if (!requiredStatus.ready) {
      alert('Заполните обязательные поля заявки.');
      return;
    }
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
          Заполните поля — ниже появится текст заявки.
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
            <input
              className="field__control"
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
              placeholder="День рождения, свадьба, выписка из роддома..."
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Дата</span>
            <input className="field__control" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>

          <div className="field">
            <span className="field__label">Время доставки</span>
            <div className="hero__actions" style={{ flexWrap: 'wrap' }}>
              <label className="toggle">
                <input
                  type="radio"
                  name="timeMode"
                  value="exact"
                  checked={timeMode === 'exact'}
                  onChange={() => {
                    setTimeMode('exact');
                    setTimeFrom('');
                    setTimeTo('');
                  }}
                />
                <span>Точное время</span>
              </label>
              <label className="toggle">
                <input
                  type="radio"
                  name="timeMode"
                  value="range"
                  checked={timeMode === 'range'}
                  onChange={() => {
                    setTimeMode('range');
                    setTimeExact('');
                  }}
                />
                <span>Окно доставки</span>
              </label>
            </div>
          </div>

          {timeMode === 'exact' ? (
            <label className="field">
              <span className="field__label">Время</span>
              <input
                className="field__control"
                type="time"
                value={timeExact}
                onChange={(event) => setTimeExact(event.target.value)}
                required={timeMode === 'exact'}
              />
            </label>
          ) : (
            <div className="grid inscription__grid">
              <label className="field">
                <span className="field__label">С</span>
                <input
                  className="field__control"
                  type="time"
                  value={timeFrom}
                  onChange={(event) => setTimeFrom(event.target.value)}
                  required={timeMode === 'range'}
                />
              </label>
              <label className="field">
                <span className="field__label">До</span>
                <input
                  className="field__control"
                  type="time"
                  value={timeTo}
                  onChange={(event) => setTimeTo(event.target.value)}
                  required={timeMode === 'range'}
                />
              </label>
            </div>
          )}

          <label className="field">
            <span className="field__label">Адрес / локация</span>
            <input
              className="field__control"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Орша, ..."
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Цвета / стиль</span>
            <input
              className="field__control"
              value={colors}
              onChange={(event) => setColors(event.target.value)}
              placeholder="Белый+золото, пастель, гендер-пати..."
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Бюджет</span>
            <input className="field__control" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Например: до 100 BYN" required />
          </label>

          <label className="field field--full">
            <span className="field__label">Комментарий</span>
            <textarea className="field__control" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Размеры, надпись, наполнение, пожелания..." />
          </label>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel__title">Текст заявки</h2>
        {!requiredStatus.ready ? (
          <div className="notice notice--warn" role="status" style={{ marginBottom: 12 }}>
            Заполните обязательные поля: {requiredStatus.missing.join(', ')}.
          </div>
        ) : null}
        <pre className="pre">{requestText}</pre>
        <div className="hero__actions">
          <button className="btn btn--primary" onClick={copy} type="button" disabled={!requiredStatus.ready}>
            Скопировать
          </button>
          <a
            className="btn btn--secondary"
            href={telegramShare}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!requiredStatus.ready}
            tabIndex={requiredStatus.ready ? 0 : -1}
            onClick={(event) => {
              if (!requiredStatus.ready) event.preventDefault();
            }}
          >
            Написать в Telegram
          </a>
          <a
            className="btn btn--ghost"
            href={site.socials.instagramDm}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!requiredStatus.ready}
            tabIndex={requiredStatus.ready ? 0 : -1}
            onClick={(event) => {
              if (!requiredStatus.ready) event.preventDefault();
            }}
          >
            Написать в Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
