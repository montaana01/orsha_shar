export type ProductType = 'balloon' | 'foilStar' | 'bubble';

export const PRODUCT_LABEL: Record<ProductType, string> = {
  balloon: 'Шар (латекс)',
  foilStar: 'Звезда (фольга)',
  bubble: 'Шар Bubbles'
};

export const PRODUCT_SIZES_CM: Record<ProductType, number[]> = {
  balloon: [30, 35, 45],
  foilStar: [45, 60],
  bubble: [45, 50, 60]
};

/**
 * Внутренний коэффициент “безопасной зоны”, чтобы надпись не выходила к краям изделия.
 * Значения подобраны консервативно и легко настраиваются.
 */
export const SAFE_INSET: Record<ProductType, number> = {
  balloon: 0.82,
  foilStar: 0.76,
  bubble: 0.8
};

/**
 * Оценка допустимой “полезной нагрузки” надписи (г) для каждого изделия и размера.
 * Это эвристика: на практике зависит от гелия, температуры, качества шара и т.д.
 * При необходимости отредактируйте значения под вашу реальную статистику.
 */
export const PAYLOAD_LIMIT_G: Record<ProductType, Record<number, number>> = {
  balloon: {
    30: 0.8,
    35: 1.0,
    45: 1.4
  },
  foilStar: {
    45: 1.6,
    60: 2.2
  },
  bubble: {
    45: 1.6,
    50: 1.9,
    60: 2.4
  }
};

export const MATERIALS = [
  { id: 'vinyl', label: 'Винил (наклейка)', gPerCm2: 0.003 },
  { id: 'film', label: 'Плёнка (термо)', gPerCm2: 0.0025 }
] as const;

export const COLOR_PRESETS = [
  { id: 'white', label: 'Белый', value: '#FFFFFF' },
  { id: 'black', label: 'Чёрный', value: '#111111' },
  { id: 'gold', label: 'Золото', value: '#C9A227' },
  { id: 'silver', label: 'Серебро', value: '#C6CBD4' },
  { id: 'rose', label: 'Розовое золото', value: '#C48C86' },
  { id: 'red', label: 'Красный', value: '#D22B2B' },
  { id: 'blue', label: 'Синий', value: '#2B5BD2' },
  { id: 'pink', label: 'Розовый', value: '#E45B9B' }
] as const;

export const FONT_PRESETS = [
  { id: 'system-sans', label: 'Системный Sans', css: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' },
  { id: 'system-serif', label: 'Системный Serif', css: 'ui-serif, Georgia, Times New Roman, Times' },
  { id: 'classic', label: 'Классический', css: 'ui-serif, Georgia, Times New Roman, Times' },
  { id: 'modern', label: 'Современный', css: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }
] as const;

export const DEFAULT_COVERAGE_FACTOR = 0.55;
export const MAX_LINES = 4;
export const MAX_CHARS = 48;
