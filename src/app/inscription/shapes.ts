import type { ProductType } from '@/content/inscription';
import { SAFE_INSET } from '@/content/inscription';

export type Point = { x: number; y: number };

const PAD = 18;

function scalePoints(points: Point[], cx: number, cy: number, k: number): Point[] {
  return points.map((p) => ({ x: cx + (p.x - cx) * k, y: cy + (p.y - cy) * k }));
}

export function circlePath(sizePx: number, radius: number): string {
  const c = sizePx / 2;
  const r = radius;
  return `M ${c}, ${c} m -${r}, 0 a ${r},${r} 0 1,0 ${2 * r},0 a ${r},${r} 0 1,0 -${2 * r},0`;
}

export function starPoints(sizePx: number): Point[] {
  const c = sizePx / 2;
  const rOuter = c - PAD;
  const rInner = rOuter * 0.45;
  const pts: Point[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push({ x: c + r * Math.cos(ang), y: c + r * Math.sin(ang) });
  }
  return pts;
}

export function heartPoints(sizePx: number): Point[] {
  const sampleCubic = (p0: Point, p1: Point, p2: Point, p3: Point, steps: number) => {
    const pts: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const t2 = t * t;
      const x = p0.x * mt2 * mt + 3 * p1.x * mt2 * t + 3 * p2.x * mt * t2 + p3.x * t2 * t;
      const y = p0.y * mt2 * mt + 3 * p1.y * mt2 * t + 3 * p2.y * mt * t2 + p3.y * t2 * t;
      pts.push({ x, y });
    }
    return pts;
  };

  const p0 = { x: 0.5, y: 0.24 };
  const p1 = { x: 0.38, y: 0.05 };
  const p2 = { x: 0.16, y: 0.1 };
  const p3 = { x: 0.08, y: 0.4 };

  const p4 = { x: 0.04, y: 0.7 };
  const p5 = { x: 0.28, y: 0.95 };
  const p6 = { x: 0.5, y: 0.98 };

  const p7 = { x: 0.72, y: 0.95 };
  const p8 = { x: 0.96, y: 0.7 };
  const p9 = { x: 0.92, y: 0.4 };

  const p10 = { x: 0.84, y: 0.1 };
  const p11 = { x: 0.62, y: 0.05 };
  const p12 = { x: 0.5, y: 0.24 };

  const segments = [
    [p0, p1, p2, p3],
    [p3, p4, p5, p6],
    [p6, p7, p8, p9],
    [p9, p10, p11, p12]
  ] as const;

  const raw: Point[] = [];
  segments.forEach((seg, idx) => {
    const sampled = sampleCubic(seg[0], seg[1], seg[2], seg[3], 36);
    if (idx > 0) sampled.shift();
    raw.push(...sampled);
  });

  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const target = sizePx - PAD * 2;
  const scale = Math.min(target / width, target / height);
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return raw.map((p) => ({
    x: cx + (p.x - centerX) * scale,
    y: cy + (p.y - centerY) * scale
  }));
}

export function boxPoints(sizePx: number): Point[] {
  const max = sizePx - PAD;
  const min = PAD;
  return [
    { x: min, y: min },
    { x: max, y: min },
    { x: max, y: max },
    { x: min, y: max }
  ];
}

export function pointsToPath(points: Point[]): string {
  if (!points.length) return '';
  return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z';
}

export type ShapeDef =
  | {
      kind: 'circle';
      sizePx: number;
      cx: number;
      cy: number;
      outlinePath: string;
      safePath: string;
      outerRadius: number;
      safeRadius: number;
    }
  | {
      kind: 'polygon';
      sizePx: number;
      cx: number;
      cy: number;
      outlinePath: string;
      safePath: string;
      outerPoints: Point[];
      safePoints: Point[];
    };

export function getShape(type: ProductType, sizePx: number): ShapeDef {
  const c = sizePx / 2;
  const inset = SAFE_INSET[type];

  if (type === 'box') {
    const outer = boxPoints(sizePx);
    const safe = scalePoints(outer, c, c, inset);
    return {
      kind: 'polygon',
      sizePx,
      cx: c,
      cy: c,
      outlinePath: pointsToPath(outer),
      safePath: pointsToPath(safe),
      outerPoints: outer,
      safePoints: safe
    };
  }

  if (type === 'foilStar') {
    const outer = starPoints(sizePx);
    const safe = scalePoints(outer, c, c, inset);
    return {
      kind: 'polygon',
      sizePx,
      cx: c,
      cy: c,
      outlinePath: pointsToPath(outer),
      safePath: pointsToPath(safe),
      outerPoints: outer,
      safePoints: safe
    };
  }

  if (type === 'foilHeart') {
    const outer = heartPoints(sizePx);
    const safe = scalePoints(outer, c, c, inset);
    return {
      kind: 'polygon',
      sizePx,
      cx: c,
      cy: c,
      outlinePath: pointsToPath(outer),
      safePath: pointsToPath(safe),
      outerPoints: outer,
      safePoints: safe
    };
  }

  const outerRadius = c - PAD;
  const safeRadius = outerRadius * inset;
  return {
    kind: 'circle',
    sizePx,
    cx: c,
    cy: c,
    outlinePath: circlePath(sizePx, outerRadius),
    safePath: circlePath(sizePx, safeRadius),
    outerRadius,
    safeRadius
  };
}

export function pointInPolygon(poly: Point[], p: Point): boolean {
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 0.0000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
