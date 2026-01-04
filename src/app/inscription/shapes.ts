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
