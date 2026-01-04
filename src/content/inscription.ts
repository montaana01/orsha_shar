export type ProductType = 'box' | 'foilStar' | 'bubble';

export const PRODUCT_LABEL: Record<ProductType, string> = {
  box: 'Коробка сюрприз',
  foilStar: 'Звезда (фольга)',
  bubble: 'Шар Bubbles'
};

export const PRODUCT_SIZES_CM: Record<ProductType, number[]> = {
  box: [60],
  foilStar: [45, 60],
  bubble: [45, 50, 60]
};

/**
 * Внутренний коэффициент “безопасной зоны”, чтобы надпись не выходила к краям изделия.
 * Значения подобраны консервативно и легко настраиваются.
 */
export const SAFE_INSET: Record<ProductType, number> = {
  box: 1,
  foilStar: 0.76,
  bubble: 0.8
};

/**
 * Оценка допустимой “полезной нагрузки” надписи (г) для каждого изделия и размера.
 * Это эвристика: на практике зависит от гелия, температуры, качества шара и т.д.
 * При необходимости отредактируйте значения под вашу реальную статистику.
 */
export const PAYLOAD_LIMIT_G: Record<ProductType, Record<number, number>> = {
  box: {
    60: Number.POSITIVE_INFINITY,
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
] as const;

export const COLOR_PRESETS = [
  { id: 'white', label: 'Белый', value: '#FFFFFF' },
  { id: 'black', label: 'Чёрный', value: '#111111' },
  { id: 'gold', label: 'Золото', value: '#C9A227' },
  { id: 'silver', label: 'Серебро', value: '#C6CBD4' },
  { id: 'red', label: 'Красный', value: '#D22B2B' },
  { id: 'blue', label: 'Синий', value: '#2B5BD2' },
] as const;

export const FONT_PRESETS = [
  {
    id: 'arctika-script',
    label: 'Arctika Script',
    css: "'Arctika Script', system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fileName: 'Arctika_script.ttf',
    fileUrl: '/fonts/Arctika_script.ttf'
  },
  {
    id: 'bad-script',
    label: 'Bad Script',
    css: "'Bad Script', system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fileName: 'Bad_Script.ttf',
    fileUrl: '/fonts/Bad_Script.ttf'
  },
  {
    id: 'bodega-script',
    label: 'Bodega Script',
    css: "'Bodega Script', system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fileName: 'Bodega Script.ttf',
    fileUrl: '/fonts/Bodega%20Script.ttf'
  },
  {
    id: 'corinthia',
    label: 'Corinthia',
    css: "'Corinthia', system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fileName: 'Corinthia.ttf',
    fileUrl: '/fonts/Corinthia.ttf'
  },
  {
    id: 'katherine',
    label: 'Katherine',
    css: "'Katherine', system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fileName: 'katherine.ttf',
    fileUrl: '/fonts/katherine.ttf'
  }
] as const;

export const DEFAULT_COVERAGE_FACTOR = 0.55;
export const MAX_LINES = 4;
export const MAX_CHARS = 48;
