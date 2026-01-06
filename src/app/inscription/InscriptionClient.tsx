'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  COLOR_PRESETS,
  DEFAULT_COVERAGE_FACTOR,
  FONT_PRESETS,
  MATERIALS,
  MAX_CHARS,
  MAX_LINES,
  PAYLOAD_LIMIT_G,
  PRODUCT_FILE_LABEL,
  PRODUCT_LABEL,
  PRODUCT_SIZES_CM,
  type ProductType
} from '@/content/inscription';
import type { ColorPreset, FontPreset } from '@/lib/data';
import { fnv1a } from '@/lib/hash';
import { getShape, pointInPolygon, pointsToPath, type Point } from './shapes';
import { Button } from '@/components/Button';

const CANVAS_PX = 720;
// Silhouette Studio often imports DXF at ~50% size, so we compensate here.
const DXF_SCALE = 2;
const BOX_SIDES = [
  { id: 'front', label: 'Передняя' },
  { id: 'right', label: 'Правая' },
  { id: 'back', label: 'Задняя' },
  { id: 'left', label: 'Левая' }
] as const;
const FOIL_SIDES = [
  { id: 'foil-front', label: 'Лицевая' },
  { id: 'foil-back', label: 'Обратная' }
] as const;

type BoxSide = (typeof BOX_SIDES)[number]['id'];
type FoilSide = (typeof FOIL_SIDES)[number]['id'];
const FOIL_PRODUCTS = new Set<ProductType>(['foilStar', 'foilHeart', 'foilCircle']);

function getViewLabel(viewKey: string) {
  if (viewKey === 'main') return 'Основная';
  return (
    BOX_SIDES.find((side) => side.id === viewKey)?.label ??
    FOIL_SIDES.find((side) => side.id === viewKey)?.label ??
    viewKey
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const GLYPH_AREA_CACHE = new WeakMap<object, Map<string, number>>();
const AREA_SEGMENTS = 8;

function polygonArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return area / 2;
}

function quadBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
  const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
  return { x, y };
}

function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const x = p0.x * mt2 * mt + 3 * p1.x * mt2 * t + 3 * p2.x * mt * t2 + p3.x * t2 * t;
  const y = p0.y * mt2 * mt + 3 * p1.y * mt2 * t + 3 * p2.y * mt * t2 + p3.y * t2 * t;
  return { x, y };
}

function pathArea(commands: OpenTypePathCommand[]): number {
  let sum = 0;
  let current: Point[] = [];
  let pen: Point | null = null;

  const closeContour = () => {
    if (current.length > 2) {
      sum += polygonArea(current);
    }
    current = [];
    pen = null;
  };

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M': {
        if (current.length) closeContour();
        const p = { x: cmd.x, y: cmd.y };
        current = [p];
        pen = p;
        break;
      }
      case 'L': {
        const p = { x: cmd.x, y: cmd.y };
        current.push(p);
        pen = p;
        break;
      }
      case 'Q': {
        if (!pen) break;
        const p0 = pen;
        const p1 = { x: cmd.x1, y: cmd.y1 };
        const p2 = { x: cmd.x, y: cmd.y };
        for (let i = 1; i <= AREA_SEGMENTS; i++) {
          const t = i / AREA_SEGMENTS;
          current.push(quadBezier(p0, p1, p2, t));
        }
        pen = p2;
        break;
      }
      case 'C': {
        if (!pen) break;
        const p0 = pen;
        const p1 = { x: cmd.x1, y: cmd.y1 };
        const p2 = { x: cmd.x2, y: cmd.y2 };
        const p3 = { x: cmd.x, y: cmd.y };
        for (let i = 1; i <= AREA_SEGMENTS; i++) {
          const t = i / AREA_SEGMENTS;
          current.push(cubicBezier(p0, p1, p2, p3, t));
        }
        pen = p3;
        break;
      }
      case 'Z':
        closeContour();
        break;
      default:
        break;
    }
  }

  if (current.length > 2) {
    sum += polygonArea(current);
  }

  return Math.abs(sum);
}

function estimateGlyphArea(glyph: { getPath?: (x: number, y: number, fontSize: number) => OpenTypePath }, unitsPerEm: number): number {
  if (!glyph.getPath) return 0;
  const path = glyph.getPath(0, 0, unitsPerEm);
  if (!path?.commands?.length) return 0;
  return pathArea(path.commands);
}

function escapeXml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sanitizeFileStem(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return 'client';
  const cleaned = trimmed
    .replace(/[^\p{L}\p{N} _-]+/gu, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return cleaned || 'client';
}

function formatDateStamp(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function svgToPngDataUrl(
  svgText: string,
  wPx: number,
  hPx: number,
  opts?: { title?: string; titleHeight?: number }
): Promise<string> {
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.decoding = 'async';
  img.src = svgUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to render SVG'));
  });

  const title = opts?.title?.trim();
  const titleHeight = title ? (opts?.titleHeight ?? 44) : 0;

  const canvas = document.createElement('canvas');
  canvas.width = wPx;
  canvas.height = hPx + titleHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  if (title) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, wPx, titleHeight);
    ctx.fillStyle = '#111111';
    ctx.font = '600 16px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, wPx / 2, titleHeight / 2);
  }

  // Transparent background is fine for preview
  ctx.drawImage(img, 0, titleHeight, wPx, hPx);
  URL.revokeObjectURL(svgUrl);

  return canvas.toDataURL('image/png');
}

type LoadedFont = {
  name: string;
  fileName: string;
  arrayBuffer: ArrayBuffer;
  font: OpenTypeFont;
};

type OpenTypePathCommand =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Q'; x1: number; y1: number; x: number; y: number }
  | { type: 'Z' };

type OpenTypePath = {
  commands: OpenTypePathCommand[];
};

type OpenTypeGlyph = {
  advanceWidth?: number;
  getPath: (x: number, y: number, fontSize: number) => OpenTypePath;
};

type OpenTypeFont = {
  unitsPerEm?: number;
  ascender?: number;
  descender?: number;
  names?: { fullName?: { en?: string } };
  charToGlyph?: (char: string) => (OpenTypeGlyph & { index?: number }) | null;
  stringToGlyphs?: (text: string) => OpenTypeGlyph[];
};

function sanitizeText(input: string) {
  const value = input.replace(/\r/g, '');
  const lines = value.split('\n').slice(0, MAX_LINES);
  const joined = lines.join('\n').slice(0, MAX_CHARS);
  return joined;
}

function estimateCoverageFromFont(text: string, font: any): number {
  if (!font) return DEFAULT_COVERAGE_FACTOR;
  const stripped = sanitizeText(text).replace(/\s+/g, '');
  if (!stripped) return DEFAULT_COVERAGE_FACTOR;
  const unitsPerEm = font.unitsPerEm || 1000;
  const emHeight =
    typeof font.ascender === 'number' && typeof font.descender === 'number' ? font.ascender - font.descender : unitsPerEm;
  const cache = GLYPH_AREA_CACHE.get(font) ?? new Map<string, number>();
  if (!GLYPH_AREA_CACHE.has(font)) GLYPH_AREA_CACHE.set(font, cache);
  let sum = 0;
  let denom = 0;
  for (const ch of stripped) {
    const glyph = font.charToGlyph?.(ch);
    if (!glyph) continue;
    const adv = glyph.advanceWidth || unitsPerEm * 0.5;
    let area = cache.get(ch);
    if (area === undefined) {
      area = estimateGlyphArea(glyph, unitsPerEm);
      if (!area) {
        const box = glyph.getBoundingBox?.();
        if (box) {
          const w = Math.max(0, box.x2 - box.x1);
          const h = Math.max(0, box.y2 - box.y1);
          area = w * h;
        } else {
          area = 0;
        }
      }
      cache.set(ch, area);
    }
    if (area > 0) {
      sum += area;
      denom += adv * emHeight;
    }
  }
  if (!denom) return DEFAULT_COVERAGE_FACTOR;
  return clamp(sum / denom, 0.12, 0.9);
}

type TextLayer = {
  id: string;
  name: string;
  text: string;
  fontPresetId: string;
  fontSizePx: number;
  lineHeightMult: number;
  letterSpacing: number;
  color: string;
  pos: { x: number; y: number };
};

type LayerMetrics = {
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
};

type EditorState = {
  product: ProductType;
  sizeCm: number;
  layersByView: Record<string, TextLayer[]>;
  activeLayerIdByView: Record<string, string>;
  activeView?: string;
  boxSide?: BoxSide;
  foilSide?: FoilSide;
  clientName?: string;
  clientContact?: string;
};

type FontOption = {
  id: string;
  label: string;
  css: string;
  fileUrl?: string;
  fileName?: string;
  source: 'db' | 'fallback';
};

export function InscriptionClient({ fonts, colors }: { fonts: FontPreset[]; colors: ColorPreset[] }) {
  const fontOptions: FontOption[] = useMemo(() => {
    const fallbackFonts = FONT_PRESETS.map((font) => ({
      id: font.id,
      label: font.label,
      css: font.css,
      fileUrl: font.fileUrl,
      fileName: font.fileName,
      source: 'fallback' as const
    }));
    const dbFonts = fonts.map((font) => ({
      id: String(font.id),
      label: font.name,
      css: `'${font.name.replace(/'/g, "\\'")}', system-ui, -apple-system, Segoe UI, Roboto, Arial`,
      fileUrl: font.fileUrl,
      fileName: font.fileName,
      source: 'db' as const
    }));

    const merged = [...fallbackFonts, ...dbFonts];
    const seen = new Set<string>();
    return merged.filter((font) => {
      const key = (font.fileName || font.label).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [fonts]);

  const colorOptions = useMemo(() => {
    if (colors.length) {
      return colors.map((color) => ({ id: color.id, value: color.value, label: color.name }));
    }
    return COLOR_PRESETS;
  }, [colors]);

  const colorOptionsByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of colorOptions) {
      map.set(option.value.toLowerCase(), option.label);
    }
    return map;
  }, [colorOptions]);

  const defaultLayerText = 'С ДНЁМ\nРОЖДЕНИЯ';
  const defaultFontPresetId = fontOptions[0]?.id ?? 'uploaded';
  const defaultColor = colorOptions[0]?.value ?? '#FFFFFF';

  const initViews = useMemo(() => {
    const createLayer = (index: number): TextLayer => ({
      id: `layer-${Math.random().toString(36).slice(2, 10)}`,
      name: `Слой ${index}`,
      text: defaultLayerText,
      fontPresetId: defaultFontPresetId,
      fontSizePx: 30,
      lineHeightMult: 1.15,
      letterSpacing: 0,
      color: defaultColor,
      pos: { x: CANVAS_PX / 2, y: CANVAS_PX / 2 }
    });

    const main = [createLayer(1)];
    const front = [createLayer(1)];
    const right = [createLayer(1)];
    const back = [createLayer(1)];
    const left = [createLayer(1)];
    const foilFront = [createLayer(1)];
    const foilBack = [createLayer(1)];
    return {
      layersByView: { main, front, right, back, left, 'foil-front': foilFront, 'foil-back': foilBack },
      activeLayerIdByView: {
        main: main[0].id,
        front: front[0].id,
        right: right[0].id,
        back: back[0].id,
        left: left[0].id,
        'foil-front': foilFront[0].id,
        'foil-back': foilBack[0].id
      }
    };
  }, [defaultColor, defaultFontPresetId, defaultLayerText]);

  const [product, setProduct] = useState<ProductType>('foilStar');
  const [sizeCm, setSizeCm] = useState<number>(PRODUCT_SIZES_CM.foilStar[0]);
  const [text, setText] = useState<string>(defaultLayerText);
  const [layerName, setLayerName] = useState<string>('Слой 1');
  const [fontPresetId, setFontPresetId] = useState<string>(defaultFontPresetId);
  const [fontSizePx, setFontSizePx] = useState<number>(30);
  const [lineHeightMult, setLineHeightMult] = useState<number>(1.15);
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [color, setColor] = useState<string>(defaultColor);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: CANVAS_PX / 2, y: CANVAS_PX / 2 });
  const [boxSide, setBoxSide] = useState<BoxSide>('front');
  const [foilSide, setFoilSide] = useState<FoilSide>('foil-front');
  const [layersByView, setLayersByView] = useState<Record<string, TextLayer[]>>(initViews.layersByView);
  const [activeLayerIdByView, setActiveLayerIdByView] = useState<Record<string, string>>(initViews.activeLayerIdByView);
  const [clientName, setClientName] = useState<string>('');
  const [clientContact, setClientContact] = useState<string>('');
  const [clientModalOpen, setClientModalOpen] = useState<boolean>(true);

  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [loadedFont, setLoadedFont] = useState<LoadedFont | null>(null);
  const [fontCacheVersion, setFontCacheVersion] = useState<number>(0);
  const [cyrillicStatus, setCyrillicStatus] = useState<{
    unsupported: string[];
    mode: 'none' | 'font' | 'browser' | 'unknown';
  }>({ unsupported: [], mode: 'none' });
  const [exportSessionId, setExportSessionId] = useState<string | null>(null);
  const [pendingExport, setPendingExport] = useState(false);
  const [pendingFitCenter, setPendingFitCenter] = useState(false);

  const textRefs = useRef<Map<string, SVGTextElement>>(new Map());
  const [layerMetrics, setLayerMetrics] = useState<Record<string, LayerMetrics>>({});
  const [bbox, setBbox] = useState<LayerMetrics>({
    w: 260,
    h: 90,
    offsetX: -130,
    offsetY: -45
  });

  const shape = useMemo(() => getShape(product, CANVAS_PX), [product]);

  const pxPerCm = useMemo(() => CANVAS_PX / sizeCm, [sizeCm]);
  const mmPerPx = useMemo(() => (sizeCm * 10) / CANVAS_PX, [sizeCm]);

  const material = MATERIALS[0];

  const isFoilProduct = FOIL_PRODUCTS.has(product);
  const activeViewKey = product === 'box' ? boxSide : isFoilProduct ? foilSide : 'main';
  const activeViewLayers = useMemo(() => layersByView[activeViewKey] ?? [], [activeViewKey, layersByView]);
  const activeLayerId = activeLayerIdByView[activeViewKey] ?? activeViewLayers[0]?.id ?? '';
  const exportViewKeys = useMemo(() => {
    if (product === 'box') return BOX_SIDES.map((side) => side.id);
    if (isFoilProduct) return FOIL_SIDES.map((side) => side.id);
    return ['main'];
  }, [isFoilProduct, product]);

  const activeLayerSnapshot = useMemo<TextLayer>(
    () => ({
      id: activeLayerId || 'layer-active',
      name: layerName,
      text,
      fontPresetId,
      fontSizePx,
      lineHeightMult,
      letterSpacing,
      color,
      pos: { ...pos }
    }),
    [activeLayerId, color, fontPresetId, fontSizePx, layerName, letterSpacing, lineHeightMult, pos, text]
  );

  const activeLayersSnapshot = useMemo(() => {
    if (!activeViewLayers.length) return [activeLayerSnapshot];
    const idx = activeViewLayers.findIndex((layer) => layer.id === activeLayerId);
    if (idx === -1) return [...activeViewLayers, activeLayerSnapshot];
    const next = [...activeViewLayers];
    next[idx] = activeLayerSnapshot;
    return next;
  }, [activeLayerId, activeLayerSnapshot, activeViewLayers]);

  const layersByViewSnapshot = useMemo(() => {
    return {
      ...layersByView,
      [activeViewKey]: activeLayersSnapshot
    };
  }, [activeLayersSnapshot, activeViewKey, layersByView]);

  const applyLayerToState = useCallback((layer: TextLayer) => {
    setLayerName(layer.name);
    setText(layer.text);
    setFontPresetId(layer.fontPresetId);
    setFontSizePx(layer.fontSizePx);
    setLineHeightMult(layer.lineHeightMult ?? 1.15);
    setLetterSpacing(layer.letterSpacing);
    setColor(layer.color);
    setPos(layer.pos);
  }, []);

  const commitActiveLayer = useCallback(
    (viewKey: string) => {
      if (!activeLayerId) return;
      setLayersByView((prev) => {
        const viewLayers = prev[viewKey] ?? [];
        const idx = viewLayers.findIndex((layer) => layer.id === activeLayerId);
        if (idx === -1) {
          return { ...prev, [viewKey]: [...viewLayers, activeLayerSnapshot] };
        }
        const nextViewLayers = [...viewLayers];
        nextViewLayers[idx] = activeLayerSnapshot;
        return { ...prev, [viewKey]: nextViewLayers };
      });
    },
    [activeLayerId, activeLayerSnapshot]
  );

  const selectView = useCallback(
    (viewKey: string) => {
      commitActiveLayer(activeViewKey);
      const viewLayers = layersByView[viewKey] ?? [];
      const nextId = activeLayerIdByView[viewKey] ?? viewLayers[0]?.id;
      const nextLayer = viewLayers.find((layer) => layer.id === nextId) ?? viewLayers[0];
      if (nextLayer) {
        setActiveLayerIdByView((prev) => ({ ...prev, [viewKey]: nextLayer.id }));
        applyLayerToState(nextLayer);
      } else {
        setPos({ x: CANVAS_PX / 2, y: CANVAS_PX / 2 });
      }
    },
    [activeLayerIdByView, activeViewKey, applyLayerToState, commitActiveLayer, layersByView]
  );

  const selectLayer = useCallback(
    (layerId: string) => {
      if (layerId === activeLayerId) return;
      const target = activeLayersSnapshot.find((layer) => layer.id === layerId);
      if (!target) return;
      commitActiveLayer(activeViewKey);
      setActiveLayerIdByView((prev) => ({ ...prev, [activeViewKey]: layerId }));
      applyLayerToState(target);
    },
    [activeLayerId, activeLayersSnapshot, activeViewKey, applyLayerToState, commitActiveLayer]
  );

  const createLayer = useCallback(
    (index: number): TextLayer => ({
      id: `layer-${Math.random().toString(36).slice(2, 10)}`,
      name: `Слой ${index}`,
      text: 'Новый слой',
      fontPresetId,
      fontSizePx,
      lineHeightMult,
      letterSpacing,
      color,
      pos: { x: CANVAS_PX / 2, y: CANVAS_PX / 2 }
    }),
    [color, fontPresetId, fontSizePx, letterSpacing, lineHeightMult]
  );

  const addLayer = useCallback(() => {
    const next = createLayer(activeLayersSnapshot.length + 1);
    setLayersByView((prev) => ({
      ...prev,
      [activeViewKey]: [...activeLayersSnapshot, next]
    }));
    setActiveLayerIdByView((prev) => ({ ...prev, [activeViewKey]: next.id }));
    applyLayerToState(next);
  }, [activeLayersSnapshot, activeViewKey, applyLayerToState, createLayer]);

  const removeLayer = useCallback(() => {
    if (activeLayersSnapshot.length <= 1) return;
    const idx = activeLayersSnapshot.findIndex((layer) => layer.id === activeLayerId);
    const remaining = activeLayersSnapshot.filter((layer) => layer.id !== activeLayerId);
    const nextActive = remaining[Math.max(0, idx - 1)] ?? remaining[0];
    setLayersByView((prev) => ({
      ...prev,
      [activeViewKey]: remaining
    }));
    if (nextActive) {
      setActiveLayerIdByView((prev) => ({ ...prev, [activeViewKey]: nextActive.id }));
      applyLayerToState(nextActive);
    }
  }, [activeLayerId, activeLayersSnapshot, activeViewKey, applyLayerToState]);

  useEffect(() => {
    if (activeLayerId || !activeViewLayers.length) return;
    const first = activeViewLayers[0];
    setActiveLayerIdByView((prev) => ({ ...prev, [activeViewKey]: first.id }));
    applyLayerToState(first);
  }, [activeLayerId, activeViewKey, activeViewLayers, applyLayerToState]);

  const selectedFont = useMemo(() => fontOptions.find((font) => font.id === fontPresetId) ?? fontOptions[0], [fontOptions, fontPresetId]);

  const fontCss = useMemo(() => {
    if (fontPresetId === 'uploaded' && loadedFont) {
      const safeName = loadedFont.name.replace(/'/g, "\\'");
      return `'${safeName}', system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    }
    return selectedFont?.css ?? 'system-ui, -apple-system, Segoe UI, Roboto, Arial';
  }, [fontPresetId, loadedFont, selectedFont]);

  const fontOptionsById = useMemo(() => {
    return new Map(fontOptions.map((font) => [font.id, font]));
  }, [fontOptions]);

  const fontCacheRef = useRef<Map<string, LoadedFont>>(new Map());
  const fontFaceLoadedRef = useRef<Set<string>>(new Set());

  const usedFontIds = useMemo(() => {
    const ids = new Set<string>();
    for (const viewLayers of Object.values(layersByViewSnapshot)) {
      for (const layer of viewLayers) {
        if (layer.fontPresetId !== 'uploaded') ids.add(layer.fontPresetId);
      }
    }
    return Array.from(ids);
  }, [layersByViewSnapshot]);

  const activeFontData =
    fontPresetId === 'uploaded' ? loadedFont : fontCacheRef.current.get(fontPresetId) ?? null;

  useEffect(() => {
    if (!fontOptions.length) return;
    if (fontPresetId !== 'uploaded' && !fontOptions.find((font) => font.id === fontPresetId)) {
      setFontPresetId(defaultFontPresetId);
    }
    setLayersByView((prev) => {
      let changed = false;
      const next: Record<string, TextLayer[]> = {};
      for (const [viewKey, viewLayers] of Object.entries(prev)) {
        const updated = viewLayers.map((layer) => {
          if (layer.fontPresetId === 'uploaded') return layer;
          if (fontOptions.find((font) => font.id === layer.fontPresetId)) return layer;
          changed = true;
          return { ...layer, fontPresetId: defaultFontPresetId };
        });
        next[viewKey] = updated;
      }
      return changed ? next : prev;
    });
  }, [defaultFontPresetId, fontOptions, fontPresetId]);

  useEffect(() => {
    if (!colorOptions.length) return;
    if (!colorOptions.find((c) => c.value.toLowerCase() === color.toLowerCase())) {
      setColor(defaultColor);
    }
    setLayersByView((prev) => {
      let changed = false;
      const next: Record<string, TextLayer[]> = {};
      for (const [viewKey, viewLayers] of Object.entries(prev)) {
        const updated = viewLayers.map((layer) => {
          if (colorOptions.find((c) => c.value.toLowerCase() === layer.color.toLowerCase())) return layer;
          changed = true;
          return { ...layer, color: defaultColor };
        });
        next[viewKey] = updated;
      }
      return changed ? next : prev;
    });
  }, [color, colorOptions, defaultColor]);

  const cyrillicChars = useMemo(() => {
    const chars = new Set<string>();
    for (const ch of text) {
      if (/[\u0400-\u04FF]/.test(ch)) chars.add(ch);
    }
    return Array.from(chars);
  }, [text]);

  const cyrillicUnsupportedPreview = useMemo(() => {
    if (!cyrillicStatus.unsupported.length) return '';
    const preview = cyrillicStatus.unsupported.slice(0, 12).join(' ');
    return cyrillicStatus.unsupported.length > 12 ? `${preview}…` : preview;
  }, [cyrillicStatus.unsupported]);

  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setIsCoarsePointer(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'inscription_session';
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `sess-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, id);
    }
    setExportSessionId(id);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedName = window.localStorage.getItem('inscription_client_name') ?? '';
    const storedContact = window.localStorage.getItem('inscription_client_contact') ?? '';
    if (storedName && storedContact) {
      setClientName(storedName);
      setClientContact(storedContact);
      setClientModalOpen(false);
    } else {
      setClientModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!loadedFont) return;
    const safeName = loadedFont.name.replace(/'/g, "\\'");
    const isOtf = loadedFont.fileName.toLowerCase().endsWith('.otf');
    const mime = isOtf ? 'font/otf' : 'font/ttf';
    const fmt = isOtf ? 'opentype' : 'truetype';
    const blob = new Blob([loadedFont.arrayBuffer], { type: mime });
    const url = URL.createObjectURL(blob);
    const style = document.createElement('style');
    style.textContent = `@font-face { font-family: '${safeName}'; src: url('${url}') format('${fmt}'); font-display: swap; }`;
    document.head.appendChild(style);
    return () => {
      style.remove();
      URL.revokeObjectURL(url);
    };
  }, [loadedFont]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    for (const id of usedFontIds) {
      const font = fontOptionsById.get(id);
      const fileUrl = font?.fileUrl;
      if (!fileUrl) continue;
      if (fontFaceLoadedRef.current.has(id)) continue;
      const safeName = font.label.replace(/'/g, "\\'");
      const styleId = `font-face-${id}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `@font-face { font-family: '${safeName}'; src: url('${fileUrl}'); font-display: swap; }`;
        document.head.appendChild(style);
      }
      fontFaceLoadedRef.current.add(id);
    }
  }, [fontOptionsById, usedFontIds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const id of usedFontIds) {
        if (fontCacheRef.current.has(id)) continue;
        const font = fontOptionsById.get(id);
        const fileUrl = font?.fileUrl;
        if (!fileUrl) continue;
        try {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error('Failed to fetch font');
          const buf = await res.arrayBuffer();
          const opentype = (await import('opentype.js')).default;
          const parsed = opentype.parse(buf) as OpenTypeFont;
          if (cancelled) return;
          fontCacheRef.current.set(id, {
            name: font.label,
            fileName: font.fileName ?? font.label,
            arrayBuffer: buf,
            font: parsed
          });
          setFontCacheVersion((v) => v + 1);
        } catch {
          // ignore load errors
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fontOptionsById, usedFontIds]);

  useEffect(() => {
    if (!cyrillicChars.length) {
      setCyrillicStatus({ unsupported: [], mode: 'none' });
      return;
    }

    if (activeFontData) {
      const unsupported = cyrillicChars.filter((ch) => {
        const glyph = activeFontData.font?.charToGlyph?.(ch);
        return !glyph || glyph.index === 0;
      });
      setCyrillicStatus({ unsupported, mode: 'font' });
      return;
    }

    if (typeof document === 'undefined' || !document.fonts?.check) {
      setCyrillicStatus({ unsupported: [], mode: 'unknown' });
      return;
    }

    const unsupported = cyrillicChars.filter((ch) => !document.fonts.check(`${fontSizePx}px ${fontCss}`, ch));
    setCyrillicStatus({ unsupported, mode: 'browser' });
  }, [activeFontData, cyrillicChars, fontCss, fontPresetId, fontSizePx]);

  // Measure actual bbox (used for geometry and physics)
  useEffect(() => {
    setLayerMetrics((prev) => {
      let changed = false;
      const next: Record<string, LayerMetrics> = { ...prev };
      for (const layer of activeLayersSnapshot) {
        const node = textRefs.current.get(layer.id);
        if (!node) continue;
        const b = node.getBBox();
        const w = Math.max(1, b.width);
        const h = Math.max(1, b.height);
        const offsetX = b.x - layer.pos.x;
        const offsetY = b.y - layer.pos.y;
        const prevMetric = prev[layer.id];
        if (!prevMetric || prevMetric.w !== w || prevMetric.h !== h || prevMetric.offsetX !== offsetX || prevMetric.offsetY !== offsetY) {
          next[layer.id] = { w, h, offsetX, offsetY };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeLayersSnapshot, fontCacheVersion]);

  useEffect(() => {
    if (!activeLayerId) return;
    const next = layerMetrics[activeLayerId];
    if (!next) return;
    setBbox((prev) => {
      if (prev.w === next.w && prev.h === next.h && prev.offsetX === next.offsetX && prev.offsetY === next.offsetY) return prev;
      return next;
    });
  }, [activeLayerId, layerMetrics]);

  const widthCm = bbox.w / pxPerCm;
  const heightCm = bbox.h / pxPerCm;

  const getFontForLayer = useCallback(
    (layer: TextLayer) => {
      if (layer.fontPresetId === 'uploaded') return loadedFont;
      if (fontCacheVersion === 0) return null;
      return fontCacheRef.current.get(layer.fontPresetId) ?? null;
    },
    [fontCacheVersion, loadedFont]
  );

  const layerCoverage = new Map<string, number>();
  for (const layer of activeLayersSnapshot) {
    const fontData = getFontForLayer(layer);
    layerCoverage.set(layer.id, estimateCoverageFromFont(layer.text, fontData?.font));
  }

  let areaCm2 = 0;
  for (const layer of activeLayersSnapshot) {
    const metrics = layerMetrics[layer.id];
    if (!metrics) continue;
    const layerArea = (metrics.w / pxPerCm) * (metrics.h / pxPerCm);
    const coverage = layerCoverage.get(layer.id) ?? DEFAULT_COVERAGE_FACTOR;
    areaCm2 += layerArea * coverage;
  }
  areaCm2 = Math.max(0, areaCm2);

  const weightG = areaCm2 * material.gPerCm2;

  const payloadLimit = PAYLOAD_LIMIT_G[product][sizeCm] ?? 1.0;
  const hasPayloadLimit = Number.isFinite(payloadLimit);
  const payloadOk = !hasPayloadLimit || weightG <= payloadLimit;

  const corners = useMemo((): Point[] => {
    const x0 = pos.x + bbox.offsetX;
    const y0 = pos.y + bbox.offsetY;
    return [
      { x: x0, y: y0 },
      { x: x0 + bbox.w, y: y0 },
      { x: x0 + bbox.w, y: y0 + bbox.h },
      { x: x0, y: y0 + bbox.h }
    ];
  }, [bbox.h, bbox.offsetX, bbox.offsetY, bbox.w, pos.x, pos.y]);

  const dragTarget = useMemo(() => {
    const pad = isCoarsePointer ? 24 : 10;
    const minSize = isCoarsePointer ? 80 : 44;
    const rawW = bbox.w + pad * 2;
    const rawH = bbox.h + pad * 2;
    const w = Math.max(rawW, minSize);
    const h = Math.max(rawH, minSize);
    return {
      w,
      h,
      offsetX: bbox.offsetX - pad - (w - rawW) / 2,
      offsetY: bbox.offsetY - pad - (h - rawH) / 2
    };
  }, [bbox.h, bbox.offsetX, bbox.offsetY, bbox.w, isCoarsePointer]);

  const isInsideSafe = useCallback(
    (centerX: number, centerY: number) => {
      const x0 = centerX + bbox.offsetX;
      const y0 = centerY + bbox.offsetY;
      const pts: Point[] = [
        { x: x0, y: y0 },
        { x: x0 + bbox.w, y: y0 },
        { x: x0 + bbox.w, y: y0 + bbox.h },
        { x: x0, y: y0 + bbox.h }
      ];

      if (shape.kind === 'circle') {
        const r2 = shape.safeRadius * shape.safeRadius;
        return pts.every((p) => (p.x - shape.cx) ** 2 + (p.y - shape.cy) ** 2 <= r2);
      }

      return pts.every((p) => pointInPolygon(shape.safePoints, p));
    },
    [bbox.h, bbox.offsetX, bbox.offsetY, bbox.w, shape]
  );

  const insideNow = useMemo(() => isInsideSafe(pos.x, pos.y), [isInsideSafe, pos.x, pos.y]);

  const isLayerInsideSafe = useCallback(
    (layer: TextLayer) => {
      const metrics = layerMetrics[layer.id];
      if (!metrics) return false;
      const x0 = layer.pos.x + metrics.offsetX;
      const y0 = layer.pos.y + metrics.offsetY;
      const pts: Point[] = [
        { x: x0, y: y0 },
        { x: x0 + metrics.w, y: y0 },
        { x: x0 + metrics.w, y: y0 + metrics.h },
        { x: x0, y: y0 + metrics.h }
      ];

      if (shape.kind === 'circle') {
        const r2 = shape.safeRadius * shape.safeRadius;
        return pts.every((p) => (p.x - shape.cx) ** 2 + (p.y - shape.cy) ** 2 <= r2);
      }

      return pts.every((p) => pointInPolygon(shape.safePoints, p));
    },
    [layerMetrics, shape]
  );

  const hasLayerMetrics = useMemo(
    () => activeLayersSnapshot.every((layer) => Boolean(layerMetrics[layer.id])),
    [activeLayersSnapshot, layerMetrics]
  );

  const allInsideSafe = useMemo(() => {
    if (!hasLayerMetrics) return false;
    return activeLayersSnapshot.every((layer) => isLayerInsideSafe(layer));
  }, [activeLayersSnapshot, hasLayerMetrics, isLayerInsideSafe]);

  const exportAllowed = hasLayerMetrics && allInsideSafe && payloadOk;
  const exportBlockReason = !hasLayerMetrics
    ? 'Подготавливаем размеры слоя.'
    : !allInsideSafe
      ? 'Надпись выходит за безопасную зону.'
      : !payloadOk
        ? 'Превышен допустимый вес надписи.'
        : '';

  const constrainToSafe = useCallback(
    (candidate: { x: number; y: number }) => {
      if (isInsideSafe(candidate.x, candidate.y)) return candidate;

      // binary search along vector from center to candidate
      const cx = shape.cx;
      const cy = shape.cy;
      let lo = 0;
      let hi = 1;
      let best = { x: cx, y: cy };

      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        const x = cx + (candidate.x - cx) * mid;
        const y = cy + (candidate.y - cy) * mid;
        if (isInsideSafe(x, y)) {
          best = { x, y };
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return best;
    },
    [isInsideSafe, shape.cx, shape.cy]
  );

  // Ensure current pos stays valid when geometry changes
  useEffect(() => {
    if (drag.current.active) return;
    setPos((p) => {
      const next = constrainToSafe(p);
      if (Math.abs(p.x - next.x) < 0.5 && Math.abs(p.y - next.y) < 0.5) return p;
      return next;
    });
  }, [constrainToSafe]);

  useEffect(() => {
    if (!pendingFitCenter || !activeLayerId) return;
    const metrics = layerMetrics[activeLayerId];
    if (!metrics) return;
    const target = {
      x: shape.cx - (metrics.offsetX + metrics.w / 2),
      y: shape.cy - (metrics.offsetY + metrics.h / 2)
    };
    setPos((prev) => {
      if (Math.abs(prev.x - target.x) < 0.5 && Math.abs(prev.y - target.y) < 0.5) return prev;
      return target;
    });
    setPendingFitCenter(false);
  }, [activeLayerId, layerMetrics, pendingFitCenter, shape.cx, shape.cy]);

  // Dragging
  const drag = useRef<{
    active: boolean;
    mode: 'move' | 'resize';
    layerId: string;
    dx: number;
    dy: number;
    startWidth?: number;
    startHeight?: number;
    startFontSize?: number;
    startOffsetX?: number;
    startOffsetY?: number;
    originX?: number;
    originY?: number;
  }>({ active: false, mode: 'move', layerId: '', dx: 0, dy: 0 });

  const pointerToSvg = (evt: React.PointerEvent<SVGGraphicsElement>) => {
    const svg = evt.currentTarget.ownerSVGElement;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const inv = svg.getScreenCTM()?.inverse();
    if (!inv) return null;
    return pt.matrixTransform(inv);
  };

  const onPointerDown = (evt: React.PointerEvent<SVGGraphicsElement>, layerId: string) => {
    const p = pointerToSvg(evt);
    if (!p) return;
    const layer = activeLayersSnapshot.find((item) => item.id === layerId);
    if (!layer) return;
    if (layerId !== activeLayerId) {
      selectLayer(layerId);
    }
    drag.current.active = true;
    drag.current.mode = 'move';
    drag.current.layerId = layerId;
    drag.current.dx = p.x - layer.pos.x;
    drag.current.dy = p.y - layer.pos.y;
    evt.currentTarget.setPointerCapture(evt.pointerId);
  };

  const onResizeHandleDown = (evt: React.PointerEvent<SVGGraphicsElement>) => {
    const p = pointerToSvg(evt);
    if (!p) return;
    drag.current.active = true;
    drag.current.mode = 'resize';
    drag.current.layerId = activeLayerId;
    drag.current.startWidth = Math.max(1, bbox.w);
    drag.current.startHeight = Math.max(1, bbox.h);
    drag.current.startFontSize = fontSizePx;
    drag.current.startOffsetX = bbox.offsetX;
    drag.current.startOffsetY = bbox.offsetY;
    drag.current.originX = pos.x + bbox.offsetX;
    drag.current.originY = pos.y + bbox.offsetY;
    evt.currentTarget.setPointerCapture(evt.pointerId);
  };

  const onPointerMove = (evt: React.PointerEvent<SVGGraphicsElement>) => {
    if (!drag.current.active) return;
    const p = pointerToSvg(evt);
    if (!p) return;
    evt.preventDefault();

    if (drag.current.mode === 'resize') {
      const originX = drag.current.originX ?? pos.x + bbox.offsetX;
      const originY = drag.current.originY ?? pos.y + bbox.offsetY;
      const startWidth = drag.current.startWidth ?? bbox.w;
      const startHeight = drag.current.startHeight ?? bbox.h;
      const startFontSize = drag.current.startFontSize ?? fontSizePx;
      const startOffsetX = drag.current.startOffsetX ?? bbox.offsetX;
      const startOffsetY = drag.current.startOffsetY ?? bbox.offsetY;
      const nextWidth = Math.max(20, p.x - originX);
      const nextHeight = Math.max(20, p.y - originY);
      const scale = Math.max(nextWidth / startWidth, nextHeight / startHeight);
      const nextSize = clamp(Math.round(startFontSize * scale), 16, 140);

      const fitsSize = (fs: number) => {
        const ratio = fs / startFontSize;
        const w = startWidth * ratio;
        const h = startHeight * ratio;
        const offsetX = startOffsetX * ratio;
        const offsetY = startOffsetY * ratio;
        const x0 = pos.x + offsetX;
        const y0 = pos.y + offsetY;
        const pts: Point[] = [
          { x: x0, y: y0 },
          { x: x0 + w, y: y0 },
          { x: x0 + w, y: y0 + h },
          { x: x0, y: y0 + h }
        ];

        if (shape.kind === 'circle') {
          const r2 = shape.safeRadius * shape.safeRadius;
          return pts.every((pt) => (pt.x - shape.cx) ** 2 + (pt.y - shape.cy) ** 2 <= r2);
        }

        return pts.every((pt) => pointInPolygon(shape.safePoints, pt));
      };

      if (fitsSize(nextSize)) {
        if (nextSize !== fontSizePx) setFontSizePx(nextSize);
        return;
      }

      let lo = 16;
      let hi = nextSize;
      let best = fontSizePx;
      for (let i = 0; i < 16; i++) {
        const mid = Math.floor((lo + hi) / 2);
        if (fitsSize(mid)) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (best !== fontSizePx) setFontSizePx(best);
      return;
    }

    const cand = { x: p.x - drag.current.dx, y: p.y - drag.current.dy };
    const bounded = {
      x: clamp(cand.x, 24, CANVAS_PX - 24),
      y: clamp(cand.y, 24, CANVAS_PX - 24)
    };
    setPos((prev) => {
      const next = constrainToSafe(bounded);
      if (Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5) return prev;
      return next;
    });
  };

  const onPointerUp = (evt: React.PointerEvent<SVGGraphicsElement>) => {
    drag.current.active = false;
    try {
      evt.currentTarget.releasePointerCapture(evt.pointerId);
    } catch {
      // ignore
    }
  };

  const clientReady = Boolean(clientName.trim() && clientContact.trim());

  const projectSeed = useMemo(() => {
    if (clientReady) {
      return `${clientName.trim().toLowerCase()}|${clientContact.trim().toLowerCase()}`;
    }
    if (exportSessionId) return `draft-${exportSessionId}`;
    return 'draft';
  }, [clientReady, clientContact, clientName, exportSessionId]);

  const projectId = useMemo(() => fnv1a(projectSeed), [projectSeed]);

  const downloadStamp = useMemo(() => formatDateStamp(new Date()), []);

  const fileBase = useMemo(() => {
    const stem = sanitizeFileStem(clientName);
    const productTag = PRODUCT_FILE_LABEL[product] ?? product;
    const parts = [downloadStamp, productTag, `${sizeCm}cm`, stem];
    return parts.filter(Boolean).join('_');
  }, [clientName, downloadStamp, product, sizeCm]);

  // Upload font (TTF/OTF) - used for “кривые” export
  const onUploadFont = async (file: File | null) => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const opentype = (await import('opentype.js')).default;
    const font = opentype.parse(buf) as OpenTypeFont;

    const name = (font?.names?.fullName?.en as string) || file.name.replace(/\.(ttf|otf)$/i, '') || 'UserFont';

    setLoadedFont({
      name,
      fileName: file.name,
      arrayBuffer: buf,
      font
    });
    setFontPresetId('uploaded');
  };

  const getLayerFontLabel = useCallback(
    (layer: TextLayer) => {
      if (layer.fontPresetId === 'uploaded') return loadedFont?.name ?? 'Загруженный шрифт';
      return fontOptionsById.get(layer.fontPresetId)?.label ?? layer.fontPresetId;
    },
    [fontOptionsById, loadedFont]
  );

  const getLayerFontCss = useCallback(
    (layer: TextLayer) => {
      if (layer.fontPresetId === 'uploaded' && loadedFont) {
        const safeName = loadedFont.name.replace(/'/g, "\\'");
        return `'${safeName}', system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      }
      const font = fontOptionsById.get(layer.fontPresetId);
      return font?.css ?? 'system-ui, -apple-system, Segoe UI, Roboto, Arial';
    },
    [fontOptionsById, loadedFont]
  );

  const buildEmbeddedFontCss = useCallback(
    (layers: TextLayer[]) => {
      const rules: string[] = [];
      const seen = new Set<string>();
      for (const layer of layers) {
        const fontData = getFontForLayer(layer);
        if (!fontData) continue;
        const safeName = fontData.name.replace(/'/g, "\\'");
        if (seen.has(safeName)) continue;
        seen.add(safeName);
        const isOtf = fontData.fileName.toLowerCase().endsWith('.otf');
        const mime = isOtf ? 'font/otf' : 'font/ttf';
        const fmt = isOtf ? 'opentype' : 'truetype';
        const b64 = arrayBufferToBase64(fontData.arrayBuffer);
        rules.push(`@font-face { font-family: '${safeName}'; src: url('data:${mime};base64,${b64}') format('${fmt}'); }`);
      }
      return rules.join('\n');
    },
    [getFontForLayer]
  );

  const makeSvgText = useCallback(
    (opts?: {
      withGuides?: boolean;
      withMeasurements?: boolean;
      embedFonts?: boolean;
      withSafeZone?: boolean;
      layers?: TextLayer[];
      focusLayerId?: string;
    }) => {
      const withGuides = opts?.withGuides ?? true;
      const withMeasurements = opts?.withMeasurements ?? false;
      const embedFonts = opts?.embedFonts ?? true;
      const wMm = sizeCm * 10;
      const hMm = sizeCm * 10;

      const withSafeZone = opts?.withSafeZone ?? showSafeZone;
      const safe = withGuides && withSafeZone;
      const strokeColor = 'rgba(0,0,0,0.18)';
      const layers = opts?.layers ?? activeLayersSnapshot;
      const focusLayerId = opts?.focusLayerId ?? activeLayerId;
      const focusLayer = layers.find((layer) => layer.id === focusLayerId) ?? layers[0];
      const focusMetrics = focusLayer ? layerMetrics[focusLayer.id] : null;
      const fontFace = embedFonts ? buildEmbeddedFontCss(layers) : '';

      const texts = layers
        .map((layer) => {
          const lines = sanitizeText(layer.text).split('\n');
          const lineHeight = layer.fontSizePx * (layer.lineHeightMult ?? 1.15);
          const tspans = lines
            .map((line, i) => {
              const dy = i === 0 ? 0 : lineHeight;
              return `<tspan x="${layer.pos.x}" dy="${dy}">${escapeXml(line)}</tspan>`;
            })
            .join('');
          const fontCss = getLayerFontCss(layer);
          return `<text x="${layer.pos.x}" y="${layer.pos.y}" text-anchor="middle" dominant-baseline="middle" style="font-family: ${fontCss}; font-size: ${layer.fontSizePx}px; letter-spacing: ${layer.letterSpacing}px; fill: ${layer.color};">${tspans}</text>`;
        })
        .join('');

      const measure = (() => {
        if (!withMeasurements || !focusLayer || !focusMetrics) return '';
        const x0 = focusLayer.pos.x + focusMetrics.offsetX;
        const y0 = focusLayer.pos.y + focusMetrics.offsetY;
        const y = y0 + focusMetrics.h + 16;
        const label = `${(focusMetrics.w / pxPerCm).toFixed(1)} см`;
        return `<g>
  <line x1="${x0}" y1="${y}" x2="${x0 + focusMetrics.w}" y2="${y}" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
  <line x1="${x0}" y1="${y - 6}" x2="${x0}" y2="${y + 6}" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
  <line x1="${x0 + focusMetrics.w}" y1="${y - 6}" x2="${x0 + focusMetrics.w}" y2="${y + 6}" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
  <text x="${x0 + focusMetrics.w / 2}" y="${y - 8}" text-anchor="middle" font-size="14" fill="rgba(0,0,0,0.7)">${label}</text>
</g>`;
      })();

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${wMm}mm" height="${hMm}mm" viewBox="0 0 ${CANVAS_PX} ${CANVAS_PX}">
  <defs>
    <style><![CDATA[
      ${fontFace}
    ]]></style>
  </defs>
  ${withGuides ? `<path d="${shape.outlinePath}" fill="none" stroke="${strokeColor}" stroke-width="2"/>` : ''}
  ${safe
          ? `<path d="${shape.safePath}" fill="none" stroke="rgba(43,91,210,0.35)" stroke-width="2" stroke-dasharray="10 8"/>`
          : ''
        }
  ${texts}
  ${measure}
</svg>`;
    },
    [
      activeLayerId,
      activeLayersSnapshot,
      buildEmbeddedFontCss,
      getLayerFontCss,
      layerMetrics,
      pxPerCm,
      shape.outlinePath,
      shape.safePath,
      showSafeZone,
      sizeCm
    ]
  );

  const importStateJson = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return;
    }
    if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) return;
    const s = (parsed as { state?: EditorState }).state;
    if (!s) return;

    setProduct(s.product);
    setSizeCm(s.sizeCm);
    if (s.clientName) setClientName(s.clientName);
    if (s.clientContact) setClientContact(s.clientContact);
    if (s.clientName && s.clientContact) setClientModalOpen(false);
    const viewKey = s.product === 'box' ? s.boxSide ?? 'front' : FOIL_PRODUCTS.has(s.product) ? s.foilSide ?? 'foil-front' : 'main';
    let resolvedLayersByView: Record<string, TextLayer[]> = s.layersByView ?? {};
    let resolvedActiveByView: Record<string, string> = s.activeLayerIdByView ?? {};

    if (!Object.keys(resolvedLayersByView).length) {
      const legacy = s as unknown as {
        text?: string;
        fontPresetId?: string;
        fontSizePx?: number;
        lineHeightMult?: number;
        letterSpacing?: number;
        color?: string;
        pos?: { x: number; y: number };
        boxSides?: Record<string, { text: string; fontPresetId: string; fontSizePx: number; letterSpacing: number; color: string; pos: { x: number; y: number } }>;
      };
      const toLayer = (name: string, source?: typeof legacy): TextLayer => ({
        id: `layer-${Math.random().toString(36).slice(2, 10)}`,
        name,
        text: source?.text ?? '',
        fontPresetId: source?.fontPresetId ?? defaultFontPresetId,
        fontSizePx: source?.fontSizePx ?? 30,
        lineHeightMult: source?.lineHeightMult ?? 1.15,
        letterSpacing: source?.letterSpacing ?? 0,
        color: source?.color ?? defaultColor,
        pos: source?.pos ?? { x: CANVAS_PX / 2, y: CANVAS_PX / 2 }
      });

      if (legacy.boxSides) {
        const front = [toLayer('Слой 1', legacy.boxSides.front)];
        const right = [toLayer('Слой 1', legacy.boxSides.right)];
        const back = [toLayer('Слой 1', legacy.boxSides.back)];
        const left = [toLayer('Слой 1', legacy.boxSides.left)];
        resolvedLayersByView = { main: front, front, right, back, left };
        resolvedActiveByView = {
          main: front[0].id,
          front: front[0].id,
          right: right[0].id,
          back: back[0].id,
          left: left[0].id
        };
      } else {
        const main = [toLayer('Слой 1', legacy)];
        resolvedLayersByView = { main };
        resolvedActiveByView = { main: main[0].id };
      }
    }

    setLayersByView(resolvedLayersByView);
    setActiveLayerIdByView((prev) => ({ ...prev, ...resolvedActiveByView }));
    if (s.product === 'box') {
      setBoxSide(viewKey as BoxSide);
    } else if (FOIL_PRODUCTS.has(s.product)) {
      setFoilSide(viewKey as FoilSide);
    }

    const viewLayers = (resolvedLayersByView[viewKey] ?? []) as TextLayer[];
    const nextId = resolvedActiveByView[viewKey] ?? viewLayers[0]?.id;
    const activeLayer = viewLayers.find((layer) => layer.id === nextId) ?? viewLayers[0];
    if (activeLayer) {
      setActiveLayerIdByView((prev) => ({ ...prev, [viewKey]: activeLayer.id }));
      applyLayerToState({
        ...activeLayer,
        lineHeightMult: activeLayer.lineHeightMult ?? 1.15
      });
    }
  };

  // --- Path export (requires font file: uploaded or preloaded) ---
  const canExportCurves = useMemo(() => {
    return activeLayersSnapshot.every((layer) => !!getFontForLayer(layer));
  }, [activeLayersSnapshot, getFontForLayer]);

  const canExportCurvesAllViews = useMemo(() => {
    if (exportViewKeys.length <= 1) return canExportCurves;
    for (const viewKey of exportViewKeys) {
      const layers = layersByViewSnapshot[viewKey] ?? [];
      for (const layer of layers) {
        if (!getFontForLayer(layer)) return false;
      }
    }
    return true;
  }, [canExportCurves, exportViewKeys, getFontForLayer, layersByViewSnapshot]);

  const buildTextPathD = useCallback(
    (layer: TextLayer, fontData: LoadedFont) => {
      const font = fontData.font;
      const unitsPerEm = font.unitsPerEm || 1000;
      const scale = layer.fontSizePx / unitsPerEm;
      const asc = (font.ascender || unitsPerEm * 0.8) * scale;
      const desc = (font.descender || -unitsPerEm * 0.2) * scale;
      const emHeight = asc - desc;
      const baselineCenterOffset = asc - emHeight / 2;

      const lines = sanitizeText(layer.text).split('\n');
      const lineHeight = layer.fontSizePx * (layer.lineHeightMult ?? 1.15);

      const startYCenter = layer.pos.y - ((lines.length - 1) * lineHeight) / 2;

      const widths = lines.map((line) => measureLineWidth(font, line, scale, layer.letterSpacing));
      const maxW = Math.max(1, ...widths);

      const paths: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineW = widths[i];
        const xStart = layer.pos.x - lineW / 2;
        const yCenter = startYCenter + i * lineHeight;
        const yBaseline = yCenter + baselineCenterOffset;

        let x = xStart;
        const glyphs = font.stringToGlyphs ? font.stringToGlyphs(line) : [];
        for (const g of glyphs) {
          const adv = (g.advanceWidth || unitsPerEm * 0.5) * scale;
          const p = g.getPath(x, yBaseline, layer.fontSizePx);
          paths.push(pathToD(p));
          x += adv + layer.letterSpacing;
        }
      }

      return { d: paths.filter(Boolean).join(' '), approxW: maxW };
    },
    []
  );

  const buildCurvesPayloadForLayers = useCallback(
    (layers: TextLayer[]) => {
      if (!layers.length) return null;
      const paths: string[] = [];
      for (const layer of layers) {
        const fontData = getFontForLayer(layer);
        if (!fontData) return null;
        const p = buildTextPathD(layer, fontData);
        if (p?.d) paths.push(p.d);
      }
      const combinedD = paths.join(' ');
      if (!combinedD) return null;
      const wMm = sizeCm * 10;
      const hMm = sizeCm * 10;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${wMm}mm" height="${hMm}mm" viewBox="0 0 ${CANVAS_PX} ${CANVAS_PX}">
  <path d="${combinedD}" fill="none" stroke="#000" stroke-width="1"/>
</svg>`;
      const bounds = (() => {
        if (shape.kind === 'circle') {
          return {
            minX: shape.cx - shape.outerRadius,
            maxX: shape.cx + shape.outerRadius,
            minY: shape.cy - shape.outerRadius,
            maxY: shape.cy + shape.outerRadius
          };
        }
        const xs = shape.outerPoints.map((p) => p.x);
        const ys = shape.outerPoints.map((p) => p.y);
        return {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys)
        };
      })();

      const textBounds = layers.reduce<{ minX: number; maxX: number; minY: number; maxY: number } | null>(
        (acc, layer) => {
          const metrics = layerMetrics[layer.id];
          if (!metrics) return acc;
          const x0 = layer.pos.x + metrics.offsetX;
          const y0 = layer.pos.y + metrics.offsetY;
          const x1 = x0 + metrics.w;
          const y1 = y0 + metrics.h;
          if (!acc) return { minX: x0, maxX: x1, minY: y0, maxY: y1 };
          return {
            minX: Math.min(acc.minX, x0),
            maxX: Math.max(acc.maxX, x1),
            minY: Math.min(acc.minY, y0),
            maxY: Math.max(acc.maxY, y1)
          };
        },
        null
      );

      const contentMaxY = Math.max(bounds.maxY, textBounds?.maxY ?? bounds.maxY);
      const measureY = contentMaxY + 18;
      const labelY = measureY + 20;
      const measureD = [
        `M ${bounds.minX} ${measureY} L ${bounds.maxX} ${measureY}`,
        `M ${bounds.minX} ${measureY - 6} L ${bounds.minX} ${measureY + 6}`,
        `M ${bounds.maxX} ${measureY - 6} L ${bounds.maxX} ${measureY + 6}`
      ].join(' ');

      let labelD = '';
      const labelFontData = getFontForLayer(layers[0]);
      if (labelFontData) {
        const labelLayer: TextLayer = {
          id: 'measure',
          name: 'Размер',
          text: `${sizeCm} см`,
          fontPresetId: layers[0]?.fontPresetId ?? 'uploaded',
          fontSizePx: 18,
          lineHeightMult: 1.1,
          letterSpacing: 0,
          color: '#000000',
          pos: { x: (bounds.minX + bounds.maxX) / 2, y: labelY }
        };
        const labelPath = buildTextPathD(labelLayer, labelFontData);
        labelD = labelPath?.d ?? '';
      }

      const outlineD = (() => {
        if (shape.kind !== 'circle') return shape.outlinePath;
        const segments = 64;
        const pts = Array.from({ length: segments }, (_, i) => {
          const ang = (i / segments) * Math.PI * 2;
          return { x: shape.cx + shape.outerRadius * Math.cos(ang), y: shape.cy + shape.outerRadius * Math.sin(ang) };
        });
        return pointsToPath(pts);
      })();

      const refPaths = [outlineD, measureD, labelD].filter(Boolean);
      const dxf = pathsToDxf(
        [
          { d: combinedD, layer: 'CUT' },
          ...(refPaths.length ? [{ d: refPaths.join(' '), layer: 'REF' }] : [])
        ],
        mmPerPx * DXF_SCALE
      );
      return { svg, dxf };
    },
    [buildTextPathD, getFontForLayer, layerMetrics, mmPerPx, shape, sizeCm]
  );

  const buildCurvesPayload = useCallback(() => {
    if (!canExportCurves) return null;
    return buildCurvesPayloadForLayers(activeLayersSnapshot);
  }, [activeLayersSnapshot, buildCurvesPayloadForLayers, canExportCurves]);

  const exportMeta = useMemo(() => {
    if (!activeLayersSnapshot.length) {
      return { fontId: null, fontName: 'Unknown', color: defaultColor };
    }

    const activeLayer = activeLayersSnapshot.find((layer) => layer.id === activeLayerId) ?? activeLayersSnapshot[0];
    const colorValue = /^#/.test(activeLayer.color) ? activeLayer.color : defaultColor;
    const fontIds = new Set(activeLayersSnapshot.map((layer) => layer.fontPresetId));

    if (fontIds.size === 1) {
      const onlyId = activeLayersSnapshot[0].fontPresetId;
      if (onlyId === 'uploaded') {
        return { fontId: null, fontName: loadedFont?.name ?? 'Загруженный шрифт', color: colorValue };
      }
      const font = fontOptionsById.get(onlyId);
      return {
        fontId: font?.source === 'db' ? Number(font.id) : null,
        fontName: font?.label ?? 'Unknown',
        color: colorValue
      };
    }

    return { fontId: null, fontName: 'Несколько шрифтов', color: colorValue };
  }, [activeLayerId, activeLayersSnapshot, defaultColor, fontOptionsById, loadedFont]);

  const displayFontLabel = exportMeta.fontName;
  const displayColorLabel = useMemo(() => {
    const normalized = exportMeta.color.toLowerCase();
    return colorOptionsByValue.get(normalized) ?? exportMeta.color.toUpperCase();
  }, [colorOptionsByValue, exportMeta.color]);

  const exportDetails = useMemo(() => {
    const views = exportViewKeys.map((viewKey) => {
      const viewLabel =
        viewKey === 'main'
          ? 'Основная'
          : BOX_SIDES.find((side) => side.id === viewKey)?.label ??
          FOIL_SIDES.find((side) => side.id === viewKey)?.label ??
          viewKey;
      const layers = (layersByViewSnapshot[viewKey] ?? []).map((layer) => {
        const metrics = layerMetrics[layer.id];
        const widthCm = metrics ? Number((metrics.w / pxPerCm).toFixed(1)) : null;
        const heightCm = metrics ? Number((metrics.h / pxPerCm).toFixed(1)) : null;
        return {
          id: layer.id,
          name: layer.name,
          text: layer.text,
          fontName: getLayerFontLabel(layer),
          fontSizePx: layer.fontSizePx,
          lineHeightMult: layer.lineHeightMult ?? 1.15,
          letterSpacing: layer.letterSpacing,
          color: layer.color,
          widthCm,
          heightCm
        };
      });
      return { id: viewKey, label: viewLabel, layers };
    });

    return {
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      product,
      sizeCm,
      views
    };
  }, [clientContact, clientName, exportViewKeys, getLayerFontLabel, layerMetrics, layersByViewSnapshot, pxPerCm, product, sizeCm]);

  const hasMultipleViews = exportViewKeys.length > 1;
  const canExportFonts = hasMultipleViews ? canExportCurvesAllViews : canExportCurves;

  const saveExportToServer = useCallback(async () => {
    if (!exportSessionId) return;
    if (!exportAllowed) {
      if (pendingExport) setPendingExport(false);
      return;
    }
    if (!canExportFonts) {
      if (!pendingExport) setPendingExport(true);
      return;
    }
    const payload = buildCurvesPayload();
    if (!payload) return;
    if (pendingExport) setPendingExport(false);
    const { fontId, fontName, color: exportColor } = exportMeta;
    let viewExports: Array<{ view: string; svg: string; dxf: string }> | undefined;

    if (hasMultipleViews) {
      for (const viewKey of exportViewKeys) {
        const layers = layersByViewSnapshot[viewKey] ?? [];
        const nextPayload = buildCurvesPayloadForLayers(layers);
        if (!nextPayload) continue;
        if (!viewExports) viewExports = [];
        viewExports.push({ view: viewKey, svg: nextPayload.svg, dxf: nextPayload.dxf });
      }
    }

    try {
      const body = {
        sessionId: exportSessionId,
        projectId,
        product,
        sizeCm,
        fontId,
        fontName,
        color: exportColor,
        clientName: clientName.trim(),
        clientContact: clientContact.trim(),
        details: exportDetails,
        svg: payload.svg,
        dxf: payload.dxf,
        ...(viewExports?.length ? { viewExports } : {})
      };
      await fetch('/api/inscription/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch {
      // ignore upload errors for now
    }
  }, [
    buildCurvesPayload,
    buildCurvesPayloadForLayers,
    canExportFonts,
    clientContact,
    clientName,
    exportAllowed,
    exportDetails,
    exportMeta,
    exportSessionId,
    exportViewKeys,
    hasMultipleViews,
    layersByViewSnapshot,
    pendingExport,
    product,
    projectId,
    sizeCm
  ]);

  useEffect(() => {
    if (!pendingExport || !canExportFonts) return;
    void saveExportToServer();
  }, [canExportFonts, pendingExport, saveExportToServer]);

  useEffect(() => {
    if (exportAllowed || !pendingExport) return;
    setPendingExport(false);
  }, [exportAllowed, pendingExport]);

  const viewSuffix = (viewKey: string) => {
    if (viewKey === 'main') return '';
    if (viewKey.startsWith('foil-')) return `-${viewKey.replace('foil-', '')}`;
    return `-${viewKey}`;
  };

  const downloadPreviewPngForView = async (viewKey: string) => {
    const layers = layersByViewSnapshot[viewKey] ?? [];
    const svg = makeSvgText({
      withGuides: true,
      withMeasurements: true,
      embedFonts: true,
      withSafeZone: true,
      layers,
      focusLayerId: activeLayerIdByView[viewKey]
    });
    const dataUrl = await svgToPngDataUrl(svg, 1200, 1200, { title: getViewLabel(viewKey) });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(`${fileBase}${viewSuffix(viewKey)}.png`, blob);
  };

  const downloadAllSides = async () => {
    if (!exportAllowed) return;
    if (!clientReady) {
      setClientModalOpen(true);
      return;
    }
    const views = product === 'box' ? BOX_SIDES.map((side) => side.id) : FOIL_SIDES.map((side) => side.id);
    await views.reduce((chain, viewKey) => {
      return chain.then(() => downloadPreviewPngForView(viewKey));
    }, Promise.resolve());
    void saveExportToServer();
  };

  const downloadPreviewPng = async () => {
    if (!exportAllowed) return;
    if (!clientReady) {
      setClientModalOpen(true);
      return;
    }
    await downloadPreviewPngForView(activeViewKey);
    void saveExportToServer();
  };

  const fitToSafe = () => {
    // Increase/decrease font size to fit within safe zone
    // Simple approach: binary search fontSizePx in [16, 140]
    const min = 16;
    const max = 140;
    let lo = min;
    let hi = max;
    let best = fontSizePx;
    const center = { x: shape.cx, y: shape.cy };

    const resolveCentered = (fs: number) => {
      const ratio = fs / fontSizePx;
      const w = bbox.w * ratio;
      const h = bbox.h * ratio;
      const offsetX = bbox.offsetX * ratio;
      const offsetY = bbox.offsetY * ratio;
      const x = center.x - (offsetX + w / 2);
      const y = center.y - (offsetY + h / 2);
      return { x, y, w, h, offsetX, offsetY };
    };

    const test = (fs: number) => {
      const { x, y, w, h, offsetX, offsetY } = resolveCentered(fs);
      const x0 = x + offsetX;
      const y0 = y + offsetY;
      const pts: Point[] = [
        { x: x0, y: y0 },
        { x: x0 + w, y: y0 },
        { x: x0 + w, y: y0 + h },
        { x: x0, y: y0 + h }
      ];

      if (shape.kind === 'circle') {
        const r2 = shape.safeRadius * shape.safeRadius;
        return pts.every((pt) => (pt.x - shape.cx) ** 2 + (pt.y - shape.cy) ** 2 <= r2);
      }
      return pts.every((pt) => pointInPolygon(shape.safePoints, pt));
    };

    for (let i = 0; i < 18; i++) {
      const mid = Math.floor((lo + hi) / 2);
      if (test(mid)) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const next = resolveCentered(best);
    setFontSizePx(best);
    setPos({ x: next.x, y: next.y });
    setPendingFitCenter(true);
  };

  const handleClientSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const name = clientName.trim();
    const contact = clientContact.trim();
    if (!name || !contact) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('inscription_client_name', name);
      window.localStorage.setItem('inscription_client_contact', contact);
    }
    setClientName(name);
    setClientContact(contact);
    setClientModalOpen(false);
  };

  return (
    <div className="section">
      {clientModalOpen ? (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__backdrop" />
          <div className="modal__panel panel">
            <h2 className="panel__title">Перед началом</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Укажите имя и контакт, чтобы мы могли связаться по заказу. Эти данные не публикуются.
            </p>
            <form onSubmit={handleClientSubmit} className="form" style={{ marginTop: 12 }}>
              <label className="field">
                <span className="field__label">Имя</span>
                <input className="field__control" name="client_name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
              </label>
              <label className="field">
                <span className="field__label">Контакт/телефон</span>
                <input className="field__control" name="client_contact" value={clientContact} onChange={(e) => setClientContact(e.target.value)} required />
              </label>
              <div className="hero__actions" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                {clientReady ? (
                  <Button type="button" variant="ghost" onClick={() => setClientModalOpen(false)}>
                    Закрыть
                  </Button>
                ) : null}
                <Button type="submit" variant="primary">
                  Продолжить
                </Button>
              </div>
            </form>
            <p className="muted" style={{ marginTop: 10 }}>
              Подробности — в <Link href="/privacy">политике конфиденциальности</Link>.
            </p>
          </div>
        </div>
      ) : null}

      <div className="section__head">
        <h1 className="section__title">Надпись онлайн</h1>
        <p className="section__subtitle">
          Сделайте макет надписи для шара, фольгированной звезды, сердца, круга или bubble. Добавляйте несколько слоёв текста,
          настраивайте шрифт и цвет, скачайте превью и файл для плоттера.
        </p>
      </div>

      <div className="inscription">
        <div className="panel inscription__preview">
          <svg className="inscription__svg" viewBox={`0 0 ${CANVAS_PX} ${CANVAS_PX}`}>
            <path d={shape.outlinePath} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={2} />
            {showSafeZone ? (
              <path
                d={shape.safePath}
                fill="none"
                stroke="rgba(43,91,210,0.35)"
                strokeWidth={2}
                strokeDasharray="10 8"
              />
            ) : null}

            <rect
              x={pos.x + dragTarget.offsetX}
              y={pos.y + dragTarget.offsetY}
              width={dragTarget.w}
              height={dragTarget.h}
              fill="transparent"
              pointerEvents="all"
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={(evt) => onPointerDown(evt, activeLayerId)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />

            {activeLayersSnapshot.map((layer) => {
              const lineHeight = layer.fontSizePx * (layer.lineHeightMult ?? 1.15);
              return (
                <text
                  key={layer.id}
                  ref={(node) => {
                    if (node) textRefs.current.set(layer.id, node);
                    else textRefs.current.delete(layer.id);
                  }}
                  x={layer.pos.x}
                  y={layer.pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={layer.color}
                  fontFamily={getLayerFontCss(layer)}
                  fontSize={layer.fontSizePx}
                  letterSpacing={layer.letterSpacing}
                  style={{ cursor: layer.id === activeLayerId ? 'grab' : 'pointer', userSelect: 'none', touchAction: 'none' }}
                  onPointerDown={(evt) => onPointerDown(evt, layer.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  {sanitizeText(layer.text).split('\n').map((line, i) => (
                    <tspan key={i} x={layer.pos.x} dy={i === 0 ? 0 : lineHeight}>
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}

            {activeLayerId ? (
              <>
                <rect
                  x={pos.x + bbox.offsetX}
                  y={pos.y + bbox.offsetY}
                  width={bbox.w}
                  height={bbox.h}
                  fill="none"
                  stroke="rgba(43,91,210,0.6)"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                />
                <circle
                  cx={pos.x + bbox.offsetX + bbox.w}
                  cy={pos.y + bbox.offsetY + bbox.h}
                  r={7}
                  fill="#2b5bd2"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ cursor: 'nwse-resize' }}
                  onPointerDown={onResizeHandleDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                />
              </>
            ) : null}

            {!insideNow ? (
              <>
                {corners.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r={6} fill="rgba(210,43,43,0.65)" />
                ))}
              </>
            ) : null}
          </svg>

          <div className="inscription__stats">
            {clientName && clientContact ? (
              <div className="kpi">
                <div className="kpi__label">Клиент</div>
                <div className="kpi__value">
                  {clientName} · {clientContact}
                </div>
              </div>
            ) : null}

            <div className="kpi">
              <div className="kpi__label">Размер слоя</div>
              <div className="kpi__value">
                {widthCm.toFixed(1)} × {heightCm.toFixed(1)} см
              </div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Площадь (суммарно)</div>
              <div className="kpi__value">{areaCm2.toFixed(1)} см²</div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Слоёв</div>
              <div className="kpi__value">{activeLayersSnapshot.length}</div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Шрифт</div>
              <div className="kpi__value capitalize">{displayFontLabel}</div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Цвет</div>
              <div className="kpi__value capitalize">{displayColorLabel}</div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Вес (оценка)</div>
              <div className="kpi__value">
                {hasPayloadLimit ? (
                  <>
                    {weightG.toFixed(2)} г / лимит {payloadLimit.toFixed(2)} г{' '}
                    {payloadOk ? <span className="ok">OK</span> : <span className="bad">Слишком много</span>}
                  </>
                ) : (
                  <>
                    {weightG.toFixed(2)} г / без лимита <span className="ok">OK</span>
                  </>
                )}
              </div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Безопасная зона (слой)</div>
              <div className="kpi__value">
                {insideNow ? <span className="ok">Текст в зоне</span> : <span className="bad">Выходит за границы</span>}
              </div>
            </div>

            {product === 'box' ? (
              <div className="kpi">
                <div className="kpi__label">Сторона</div>
                <div className="kpi__value">{BOX_SIDES.find((side) => side.id === boxSide)?.label}</div>
              </div>
            ) : isFoilProduct ? (
              <div className="kpi">
                <div className="kpi__label">Сторона</div>
                <div className="kpi__value">{FOIL_SIDES.find((side) => side.id === foilSide)?.label}</div>
              </div>
            ) : null}

            <div className="hero__actions" style={{ marginTop: 10, flexWrap: 'wrap' }}>
              <Button onClick={downloadPreviewPng} type="button" variant="secondary" disabled={!exportAllowed}>
                Скачать превью (PNG)
              </Button>
              {product === 'box' || isFoilProduct ? (
                <Button onClick={downloadAllSides} type="button" variant="ghost" disabled={!exportAllowed}>
                  Скачать все стороны
                </Button>
              ) : null}
              <Button onClick={() => setClientModalOpen(true)} type="button" variant="ghost">
                Данные клиента
              </Button>
            </div>

            {!exportAllowed ? (
              <p className="bad" style={{ marginTop: 6 }}>
                {exportBlockReason}
              </p>
            ) : null}

            {pendingExport && !canExportFonts ? (
              <p className="muted" style={{ marginTop: 6 }}>
                Подготавливаем файл для плоттера: загружаются шрифты.
              </p>
            ) : null}

            {product === 'box' ? (
              <p className="muted" style={{ marginTop: 10 }}>
                Для коробки ограничений по весу нет — надпись можно клеить на любую из 4 сторон.
              </p>
            ) : null}

            <p className="muted" style={{ marginTop: 10 }}>
              После сохранения надписи мы сформируем файл для плоттера и свяжемся с вами по указанным контактам.
            </p>
          </div>
        </div>

        <div className="panel inscription__controls">
          <div className="form">
            <label className="field">
              <span className="field__label">Изделие</span>
              <select
                className="field__control"
                name="product"
                value={product}
                onChange={(e) => {
                  const p = e.target.value as ProductType;
                  setProduct(p);
                  setSizeCm(PRODUCT_SIZES_CM[p][0]);
                  const nextViewKey = p === 'box' ? boxSide : FOIL_PRODUCTS.has(p) ? foilSide : 'main';
                  selectView(nextViewKey);
                }}
              >
                {Object.entries(PRODUCT_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Размер изделия (см)</span>
              <select className="field__control" name="size_cm" value={sizeCm} onChange={(e) => setSizeCm(Number(e.target.value))}>
                {PRODUCT_SIZES_CM[product].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            {product === 'box' ? (
              <label className="field">
                <span className="field__label">Сторона коробки</span>
                <select
                  className="field__control"
                  name="box_side"
                  value={boxSide}
                  onChange={(e) => {
                    const nextSide = e.target.value as BoxSide;
                    setBoxSide(nextSide);
                    selectView(nextSide);
                  }}
                >
                  {BOX_SIDES.map((side) => (
                    <option key={side.id} value={side.id}>
                      {side.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {isFoilProduct ? (
              <label className="field">
                <span className="field__label">Сторона фольги</span>
                <select
                  className="field__control"
                  name="foil_side"
                  value={foilSide}
                  onChange={(e) => {
                    const nextSide = e.target.value as FoilSide;
                    setFoilSide(nextSide);
                    selectView(nextSide);
                  }}
                >
                  {FOIL_SIDES.map((side) => (
                    <option key={side.id} value={side.id}>
                      {side.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="field">
              <span className="field__label">Слои текста</span>
              <div className="layerList">
                {activeLayersSnapshot.map((layer, idx) => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`layerItem ${layer.id === activeLayerId ? 'layerItem--active' : ''}`}
                    onClick={() => selectLayer(layer.id)}
                  >
                    <span className="layerItem__name">{layer.name || `Слой ${idx + 1}`}</span>
                    <span className="layerItem__preview">{sanitizeText(layer.text).split('\n')[0]}</span>
                  </button>
                ))}
              </div>
              <div className="hero__actions" style={{ marginTop: 8 }}>
                <Button onClick={addLayer} type="button" variant="secondary">
                  Добавить слой
                </Button>
                <Button onClick={removeLayer} type="button" variant="ghost" disabled={activeLayersSnapshot.length <= 1}>
                  Удалить слой
                </Button>
              </div>
            </div>

            <label className="field">
              <span className="field__label">Текст (до {MAX_LINES} строк / {MAX_CHARS} символов)</span>
              <textarea
                className="field__control"
                name="text"
                rows={5}
                value={text}
                onChange={(e) => setText(sanitizeText(e.target.value))}
                placeholder="Например: С ДНЁМ\nРОЖДЕНИЯ"
              />
            </label>

            <div className="grid inscription__grid">
              <label className="field">
                <span className="field__label">Шрифт (предпросмотр)</span>
                <select className="field__control" name="font" value={fontPresetId} onChange={(e) => setFontPresetId(e.target.value)}>
                  {fontOptions.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                  <option value="uploaded">Загруженный шрифт</option>
                </select>
              </label>

              <label className="field">
                <span className="field__label">Загрузить TTF/OTF (для “кривых”)</span>
                <input
                  className="field__control"
                  name="font_file"
                  type="file"
                  accept=".ttf,.otf"
                  onChange={(e) => onUploadFont(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {loadedFont ? (
              <div className="muted" style={{ marginTop: 4 }}>
                Загружен шрифт: <b>{loadedFont.fileName}</b>
              </div>
            ) : null}

            {cyrillicStatus.unsupported.length ? (
              <div className="notice notice--warn" role="status" style={{ marginTop: 8 }}>
                Шрифт не поддерживает кириллицу: <b>{cyrillicUnsupportedPreview}</b>. Выберите другой шрифт или загрузите TTF/OTF
                с нужными символами.
              </div>
            ) : null}

            <div className="grid inscription__grid" style={{ marginTop: 12 }}>
              <label className="field">
                <span className="field__label">Размер шрифта</span>
                <input
                  className="field__control"
                  name="font_size"
                  type="range"
                  min={16}
                  max={140}
                  value={fontSizePx}
                  onChange={(e) => setFontSizePx(Number(e.target.value))}
                />
                <div className="muted">{fontSizePx}px</div>
              </label>

              <label className="field">
                <span className="field__label">Межстрочный интервал</span>
                <input
                  className="field__control"
                  name="line_height"
                  type="range"
                  min={0.9}
                  max={2}
                  step={0.05}
                  value={lineHeightMult}
                  onChange={(e) => setLineHeightMult(Number(e.target.value))}
                />
                <div className="muted">{lineHeightMult.toFixed(2)}×</div>
              </label>
            </div>

            <div className="grid inscription__grid" style={{ marginTop: 12 }}>
              <label className="field">
                <span className="field__label">Трекинг</span>
                <input
                  className="field__control"
                  name="tracking"
                  type="range"
                  min={-2}
                  max={10}
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                />
                <div className="muted">{letterSpacing}px</div>
              </label>

              <div className="field">
                <span className="field__label">Материал</span>
                <div className="muted">Винил (наклейка)</div>
              </div>
            </div>

            <div className="grid inscription__grid" style={{ marginTop: 12 }}>
              <div className="field">
                <span className="field__label">Цвет надписи</span>
                <div className="swatches">
                  {colorOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`swatch ${color.toLowerCase() === c.value.toLowerCase() ? 'swatch--active' : ''}`}
                      title={c.label}
                      onClick={() => setColor(c.value)}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="field__label">Инструменты</span>
                <div className="hero__actions" style={{ alignItems: 'center' }}>
                  <Button onClick={fitToSafe} type="button" variant="secondary">
                    Вписать в зону
                  </Button>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      name="show_safe_zone"
                      checked={showSafeZone}
                      onChange={(e) => setShowSafeZone(e.target.checked)}
                    />
                    <span>Показать зону</span>
                  </label>
                </div>
              </div>
            </div>

            <label className="field" style={{ marginTop: 12 }}>
              <span className="field__label">Импорт ранее сохранённого JSON</span>
              <input
                className="field__control"
                name="import_json"
                type="file"
                accept=".json"
                onChange={(e) => importStateJson(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- helpers for exporting curves ---
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function pathToD(path: OpenTypePath | null | undefined): string {
  if (!path || !path.commands) return '';
  return path.commands
    .map((c) => {
      switch (c.type) {
        case 'M':
          return `M ${c.x} ${c.y}`;
        case 'L':
          return `L ${c.x} ${c.y}`;
        case 'C':
          return `C ${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
        case 'Q':
          return `Q ${c.x1} ${c.y1} ${c.x} ${c.y}`;
        case 'Z':
          return 'Z';
        default:
          return '';
      }
    })
    .join(' ');
}

function measureLineWidth(font: OpenTypeFont, line: string, scale: number, letterSpacingPx: number): number {
  const glyphs = font.stringToGlyphs ? font.stringToGlyphs(line) : [];
  let w = 0;
  for (const g of glyphs) {
    const adv = (g.advanceWidth || 500) * scale;
    w += adv + letterSpacingPx;
  }
  return glyphs.length ? w - letterSpacingPx : 0;
}

type Polyline = { points: V[]; closed: boolean };
type DxfPathGroup = { d: string; layer: string };

// --- DXF export ---
// Very small DXF writer: converts SVG path commands to LWPOLYLINE by flattening curves.
// It is “best-effort”: Silhouette Studio usually imports DXF, but may require manual scaling.
function pathsToDxf(groups: DxfPathGroup[], mmPerPx: number): string {
  const segments = groups
    .filter((group) => group.d.trim().length > 0)
    .flatMap((group) =>
      flattenPathToPolylines(group.d, 18).map((poly) => ({
        layer: group.layer,
        closed: poly.closed,
        points: poly.points.map((p) => ({ x: p.x * mmPerPx, y: p.y * mmPerPx }))
      }))
    );

  const lines: string[] = [];
  lines.push('0', 'SECTION', '2', 'HEADER');
  lines.push('9', '$ACADVER', '1', 'AC1015');
  lines.push('9', '$INSUNITS', '70', '4'); // millimeters
  lines.push('9', '$MEASUREMENT', '70', '1'); // metric
  lines.push('0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'TABLES', '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  for (const seg of segments) {
    if (seg.points.length < 2) continue;
    lines.push('0', 'LWPOLYLINE');
    lines.push('8', seg.layer); // layer
    lines.push('90', String(seg.points.length));
    lines.push('70', seg.closed ? '1' : '0');
    for (const p of seg.points) {
      lines.push('10', p.x.toFixed(3));
      lines.push('20', (-p.y).toFixed(3)); // invert Y to match CAD coords
    }
  }

  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');
  return lines.join('\n');
}

type V = { x: number; y: number };

function flattenPathToPolylines(d: string, curveSegments: number): Polyline[] {
  const tokens = d
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);

  if (!tokens) return [];

  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const result: Polyline[] = [];
  let current: V[] = [];
  let currentClosed = false;

  const nextNumber = () => Number(tokens[i++]);

  const flush = (closed = false) => {
    if (current.length) result.push({ points: current, closed });
    current = [];
    currentClosed = false;
  };

  while (i < tokens.length) {
    const t = tokens[i++];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      if (cmd === 'Z' || cmd === 'z') {
        if (current.length) {
          currentClosed = true;
          flush(true);
        }
      }
      continue;
    }
    // number token belongs to current command
    i--; // step back, parse by cmd
    if (cmd === 'M' || cmd === 'm') {
      const x = nextNumber();
      const y = nextNumber();
      cx = cmd === 'm' ? cx + x : x;
      cy = cmd === 'm' ? cy + y : y;
      sx = cx;
      sy = cy;
      flush(currentClosed);
      current.push({ x: cx, y: cy });
      cmd = cmd === 'm' ? 'l' : 'L'; // implicit lineto for subsequent pairs
      continue;
    }

    if (cmd === 'L' || cmd === 'l') {
      const x = nextNumber();
      const y = nextNumber();
      cx = cmd === 'l' ? cx + x : x;
      cy = cmd === 'l' ? cy + y : y;
      current.push({ x: cx, y: cy });
      continue;
    }

    if (cmd === 'C' || cmd === 'c') {
      const x1 = nextNumber();
      const y1 = nextNumber();
      const x2 = nextNumber();
      const y2 = nextNumber();
      const x = nextNumber();
      const y = nextNumber();

      const p0 = { x: cx, y: cy };
      const p1 = { x: cmd === 'c' ? cx + x1 : x1, y: cmd === 'c' ? cy + y1 : y1 };
      const p2 = { x: cmd === 'c' ? cx + x2 : x2, y: cmd === 'c' ? cy + y2 : y2 };
      const p3 = { x: cmd === 'c' ? cx + x : x, y: cmd === 'c' ? cy + y : y };

      for (let s = 1; s <= curveSegments; s++) {
        const t = s / curveSegments;
        const pt = cubicAt(p0, p1, p2, p3, t);
        current.push(pt);
      }
      cx = p3.x;
      cy = p3.y;
      continue;
    }

    if (cmd === 'Q' || cmd === 'q') {
      const x1 = nextNumber();
      const y1 = nextNumber();
      const x = nextNumber();
      const y = nextNumber();

      const p0 = { x: cx, y: cy };
      const p1 = { x: cmd === 'q' ? cx + x1 : x1, y: cmd === 'q' ? cy + y1 : y1 };
      const p2 = { x: cmd === 'q' ? cx + x : x, y: cmd === 'q' ? cy + y : y };

      for (let s = 1; s <= curveSegments; s++) {
        const t = s / curveSegments;
        const pt = quadAt(p0, p1, p2, t);
        current.push(pt);
      }
      cx = p2.x;
      cy = p2.y;
      continue;
    }

    // Unsupported command: consume one number to avoid infinite loop
    nextNumber();
  }

  flush();
  return result;
}

function cubicAt(p0: V, p1: V, p2: V, p3: V, t: number): V {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = 3 * mt2 * t;
  const c = 3 * mt * t2;
  const d = t2 * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
  };
}

function quadAt(p0: V, p1: V, p2: V, t: number): V {
  const mt = 1 - t;
  const a = mt * mt;
  const b = 2 * mt * t;
  const c = t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x, y: a * p0.y + b * p1.y + c * p2.y };
}
