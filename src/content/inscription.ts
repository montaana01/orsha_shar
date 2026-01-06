export type ProductType = 'foilStar' | 'foilHeart' | 'foilCircle' | 'bubble' | 'box';

export const PRODUCT_LABEL: Record<ProductType, string> = {
  foilStar: 'Звезда (фольга)',
  foilHeart: 'Сердце (фольга)',
  foilCircle: 'Круг (фольга)',
  bubble: 'Шар Bubbles',
  box: 'Коробка сюрприз'
};

export const PRODUCT_FILE_LABEL: Record<ProductType, string> = {
  foilStar: 'foil-star',
  foilHeart: 'foil-heart',
  foilCircle: 'foil-circle',
  bubble: 'bubbles',
  box: 'box'
};

export const PRODUCT_SIZES_CM: Record<ProductType, number[]> = {
  box: [60],
  foilStar: [30, 34, 50],
  foilHeart: [30, 34, 50],
  foilCircle: [30, 50, 60, 65],
  bubble: [42, 50, 65]
};

/**
 * Внутренний коэффициент “безопасной зоны”, чтобы надпись не выходила к краям изделия.
 * Значения подобраны консервативно и легко настраиваются.
 */
export const SAFE_INSET: Record<ProductType, number> = {
  box: 1,
  foilStar: 0.76,
  foilHeart: 0.78,
  foilCircle: 0.8,
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
    30: 8,
    34: 9,
    50: 11
  },
  foilHeart: {
    30: 8,
    34: 9,
    50: 11
  },
  foilCircle: {
    30: 8,
    50: 9,
    60: 10,
    65: 11
  },
  bubble: {
    42: 9,
    50: 10,
    65: 11
  }
};

export const MATERIALS = [
  { id: 'vinyl', label: 'Винил (наклейка)', gPerCm2: 0.1 },
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
