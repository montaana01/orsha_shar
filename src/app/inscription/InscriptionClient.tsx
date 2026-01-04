'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COLOR_PRESETS,
  DEFAULT_COVERAGE_FACTOR,
  FONT_PRESETS,
  MATERIALS,
  MAX_CHARS,
  MAX_LINES,
  PAYLOAD_LIMIT_G,
  PRODUCT_LABEL,
  PRODUCT_SIZES_CM,
  type ProductType
} from '@/content/inscription';
import { fnv1a } from '@/lib/hash';
import { getShape, pointInPolygon, type Point } from './shapes';
import { Button } from '@/components/Button';

const CANVAS_PX = 720;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function escapeXml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
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

async function svgToPngDataUrl(svgText: string, wPx: number, hPx: number): Promise<string> {
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.decoding = 'async';
  img.src = svgUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to render SVG'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Transparent background is fine for preview
  ctx.drawImage(img, 0, 0, wPx, hPx);
  URL.revokeObjectURL(svgUrl);

  return canvas.toDataURL('image/png');
}

type LoadedFont = {
  name: string;
  fileName: string;
  arrayBuffer: ArrayBuffer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any;
};

function sanitizeText(input: string) {
  const value = input.replace(/\r/g, '');
  const lines = value.split('\n').slice(0, MAX_LINES);
  const joined = lines.join('\n').slice(0, MAX_CHARS);
  return joined;
}

type EditorState = {
  product: ProductType;
  sizeCm: number;
  text: string;
  fontPresetId: string;
  fontSizePx: number;
  letterSpacing: number;
  color: string;
  materialId: (typeof MATERIALS)[number]['id'];
  coverage: number;
  pos: { x: number; y: number };
};

export function InscriptionClient() {
  const [product, setProduct] = useState<ProductType>('balloon');
  const [sizeCm, setSizeCm] = useState<number>(PRODUCT_SIZES_CM.balloon[0]);
  const [text, setText] = useState<string>('С ДНЁМ\nРОЖДЕНИЯ');
  const [fontPresetId, setFontPresetId] = useState<string>(FONT_PRESETS[0].id);
  const [fontSizePx, setFontSizePx] = useState<number>(64);
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [color, setColor] = useState<string>('#FFFFFF');
  const [materialId, setMaterialId] = useState<(typeof MATERIALS)[number]['id']>(MATERIALS[0].id);
  const [coverage, setCoverage] = useState<number>(DEFAULT_COVERAGE_FACTOR);

  const [pos, setPos] = useState<{ x: number; y: number }>({ x: CANVAS_PX / 2, y: CANVAS_PX / 2 });

  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [loadedFont, setLoadedFont] = useState<LoadedFont | null>(null);

  const textRef = useRef<SVGTextElement | null>(null);
  const [bboxSize, setBboxSize] = useState<{ w: number; h: number }>({ w: 260, h: 90 });

  const shape = useMemo(() => getShape(product, CANVAS_PX), [product]);

  const pxPerCm = useMemo(() => CANVAS_PX / sizeCm, [sizeCm]);
  const mmPerPx = useMemo(() => (sizeCm * 10) / CANVAS_PX, [sizeCm]);

  const material = useMemo(() => MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0], [materialId]);

  const fontCss = useMemo(() => {
    if (fontPresetId === 'uploaded' && loadedFont) return `'${loadedFont.name}', system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const preset = FONT_PRESETS.find((f) => f.id === fontPresetId) ?? FONT_PRESETS[0];
    return preset.css;
  }, [fontPresetId, loadedFont]);

  // Measure actual bbox (used for geometry and physics)
  useEffect(() => {
    if (!textRef.current) return;
    const b = textRef.current.getBBox();
    setBboxSize({ w: Math.max(1, b.width), h: Math.max(1, b.height) });
  }, [text, fontCss, fontSizePx, letterSpacing, pos.x, pos.y]);

  const widthCm = bboxSize.w / pxPerCm;
  const heightCm = bboxSize.h / pxPerCm;
  const areaCm2 = Math.max(0, widthCm * heightCm * coverage);
  const weightG = areaCm2 * material.gPerCm2;

  const payloadLimit = PAYLOAD_LIMIT_G[product][sizeCm] ?? 1.0;
  const payloadOk = weightG <= payloadLimit;

  const corners = useMemo((): Point[] => {
    const halfW = bboxSize.w / 2;
    const halfH = bboxSize.h / 2;
    return [
      { x: pos.x - halfW, y: pos.y - halfH },
      { x: pos.x + halfW, y: pos.y - halfH },
      { x: pos.x + halfW, y: pos.y + halfH },
      { x: pos.x - halfW, y: pos.y + halfH }
    ];
  }, [bboxSize.w, bboxSize.h, pos.x, pos.y]);

  const isInsideSafe = useCallback(
    (centerX: number, centerY: number) => {
      const halfW = bboxSize.w / 2;
      const halfH = bboxSize.h / 2;
      const pts: Point[] = [
        { x: centerX - halfW, y: centerY - halfH },
        { x: centerX + halfW, y: centerY - halfH },
        { x: centerX + halfW, y: centerY + halfH },
        { x: centerX - halfW, y: centerY + halfH }
      ];

      if (shape.kind === 'circle') {
        const r2 = shape.safeRadius * shape.safeRadius;
        return pts.every((p) => (p.x - shape.cx) ** 2 + (p.y - shape.cy) ** 2 <= r2);
      }

      return pts.every((p) => pointInPolygon(shape.safePoints, p));
    },
    [bboxSize.h, bboxSize.w, shape]
  );

  const insideNow = useMemo(() => isInsideSafe(pos.x, pos.y), [isInsideSafe, pos.x, pos.y]);

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

  // Ensure current pos stays valid when product/size/font changes
  useEffect(() => {
    setPos((p) => constrainToSafe(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, sizeCm, fontCss, fontSizePx, letterSpacing, text]);

  // Dragging
  const drag = useRef<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });

  const pointerToSvg = (evt: React.PointerEvent<SVGTextElement>) => {
    const svg = evt.currentTarget.ownerSVGElement;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const inv = svg.getScreenCTM()?.inverse();
    if (!inv) return null;
    return pt.matrixTransform(inv);
  };

  const onPointerDown = (evt: React.PointerEvent<SVGTextElement>) => {
    const p = pointerToSvg(evt);
    if (!p) return;
    drag.current.active = true;
    drag.current.dx = p.x - pos.x;
    drag.current.dy = p.y - pos.y;
    evt.currentTarget.setPointerCapture(evt.pointerId);
  };

  const onPointerMove = (evt: React.PointerEvent<SVGTextElement>) => {
    if (!drag.current.active) return;
    const p = pointerToSvg(evt);
    if (!p) return;
    evt.preventDefault();

    const cand = { x: p.x - drag.current.dx, y: p.y - drag.current.dy };
    // Keep in canvas bounds first (minor), then strict safe constrain
    const bounded = {
      x: clamp(cand.x, 24, CANVAS_PX - 24),
      y: clamp(cand.y, 24, CANVAS_PX - 24)
    };
    setPos(constrainToSafe(bounded));
  };

  const onPointerUp = (evt: React.PointerEvent<SVGTextElement>) => {
    drag.current.active = false;
    try {
      evt.currentTarget.releasePointerCapture(evt.pointerId);
    } catch {
      // ignore
    }
  };

  // Project ID
  const stateForId = useMemo(() => {
    const s: EditorState = {
      product,
      sizeCm,
      text,
      fontPresetId,
      fontSizePx,
      letterSpacing,
      color,
      materialId,
      coverage,
      pos
    };
    return s;
  }, [product, sizeCm, text, fontPresetId, fontSizePx, letterSpacing, color, materialId, coverage, pos]);

  const projectId = useMemo(() => fnv1a(JSON.stringify(stateForId)), [stateForId]);

  // Upload font (TTF/OTF) - used for “кривые” export
  const onUploadFont = async (file: File | null) => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const opentype = (await import('opentype.js')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const font: any = opentype.parse(buf);

    const name = (font?.names?.fullName?.en as string) || file.name.replace(/\.(ttf|otf)$/i, '') || 'UserFont';

    setLoadedFont({
      name,
      fileName: file.name,
      arrayBuffer: buf,
      font
    });
    setFontPresetId('uploaded');
  };

  const makeSvgText = useCallback(
    (opts?: { withGuides?: boolean }) => {
      const withGuides = opts?.withGuides ?? true;
      const wMm = sizeCm * 10;
      const hMm = sizeCm * 10;

      const safe = showSafeZone && withGuides;
      const strokeColor = 'rgba(0,0,0,0.18)';

      const fontFace = (() => {
        if (!(loadedFont && fontPresetId === 'uploaded')) return '';
        const isOtf = loadedFont.fileName.toLowerCase().endsWith('.otf');
        const mime = isOtf ? 'font/otf' : 'font/ttf';
        const fmt = isOtf ? 'opentype' : 'truetype';
        const b64 = arrayBufferToBase64(loadedFont.arrayBuffer);
        return `@font-face { font-family: '${loadedFont.name}'; src: url('data:${mime};base64,${b64}') format('${fmt}'); }`;
      })();

      const lines = sanitizeText(text).split('\n');
      const lineHeight = fontSizePx * 1.15;

      const tspans = lines
        .map((line, i) => {
          const dy = i === 0 ? 0 : lineHeight;
          return `<tspan x="${pos.x}" dy="${dy}">${escapeXml(line)}</tspan>`;
        })
        .join('');

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${wMm}mm" height="${hMm}mm" viewBox="0 0 ${CANVAS_PX} ${CANVAS_PX}">
  <defs>
    <style><![CDATA[
      ${fontFace}
      .txt { font-family: ${fontCss}; font-size: ${fontSizePx}px; letter-spacing: ${letterSpacing}px; fill: ${color}; }
    ]]></style>
  </defs>
  ${withGuides ? `<path d="${shape.outlinePath}" fill="none" stroke="${strokeColor}" stroke-width="2"/>` : ''}
  ${safe
          ? `<path d="${shape.safePath}" fill="none" stroke="rgba(43,91,210,0.35)" stroke-width="2" stroke-dasharray="10 8"/>`
          : ''
        }
  <text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle" class="txt">${tspans}</text>
</svg>`;
    },
    [
      color,
      fontCss,
      fontPresetId,
      fontSizePx,
      letterSpacing,
      loadedFont,
      pos.x,
      pos.y,
      shape.outlinePath,
      shape.safePath,
      showSafeZone,
      sizeCm,
      text
    ]
  );

  const downloadSvg = () => {
    const svg = makeSvgText({ withGuides: true });
    downloadBlob(`inscription-${projectId}.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  };

  const downloadPreviewPng = async () => {
    const svg = makeSvgText({ withGuides: true });
    const dataUrl = await svgToPngDataUrl(svg, 1200, 1200);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(`inscription-${projectId}.png`, blob);
  };

  const downloadStateJson = () => {
    const payload = {
      id: projectId,
      createdAt: new Date().toISOString(),
      state: stateForId,
      note: 'This file stores only editor state. No personal data.'
    };
    downloadBlob(`inscription-${projectId}.json`, new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  };

  const importStateJson = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = JSON.parse(text);
    const s: EditorState = parsed?.state;
    if (!s) return;

    setProduct(s.product);
    setSizeCm(s.sizeCm);
    setText(s.text);
    setFontPresetId(s.fontPresetId);
    setFontSizePx(s.fontSizePx);
    setLetterSpacing(s.letterSpacing);
    setColor(s.color);
    setMaterialId(s.materialId);
    setCoverage(s.coverage);
    setPos(s.pos);
  };

  // --- Path export (requires uploaded font) ---
  const canExportCurves = !!loadedFont && fontPresetId === 'uploaded';

  const buildTextPathD = useCallback(() => {
    if (!loadedFont) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const font: any = loadedFont.font;
    const unitsPerEm = font.unitsPerEm || 1000;
    const scale = fontSizePx / unitsPerEm;
    const asc = (font.ascender || unitsPerEm * 0.8) * scale;
    const desc = (font.descender || -unitsPerEm * 0.2) * scale;
    const emHeight = asc - desc;
    const baselineCenterOffset = asc - emHeight / 2;

    const lines = sanitizeText(text).split('\n');
    const lineHeight = fontSizePx * 1.15;

    const startYCenter = pos.y - ((lines.length - 1) * lineHeight) / 2;

    // First compute widths for alignment
    const widths = lines.map((line) => measureLineWidth(font, line, scale, letterSpacing));
    const maxW = Math.max(1, ...widths);

    const paths: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineW = widths[i];
      const xStart = pos.x - lineW / 2;
      const yCenter = startYCenter + i * lineHeight;
      const yBaseline = yCenter + baselineCenterOffset;

      let x = xStart;
      const glyphs = font.stringToGlyphs(line);
      for (const g of glyphs) {
        const adv = (g.advanceWidth || unitsPerEm * 0.5) * scale;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p: any = g.getPath(x, yBaseline, fontSizePx);
        paths.push(pathToD(p));
        x += adv + letterSpacing;
      }
    }

    // Return combined d and bbox for guides if needed
    return { d: paths.filter(Boolean).join(' '), approxW: maxW };
  }, [fontPresetId, fontSizePx, letterSpacing, loadedFont, pos.x, pos.y, text]);

  const downloadCutSvgCurves = () => {
    if (!canExportCurves) return;
    const p = buildTextPathD();
    if (!p) return;

    const wMm = sizeCm * 10;
    const hMm = sizeCm * 10;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${wMm}mm" height="${hMm}mm" viewBox="0 0 ${CANVAS_PX} ${CANVAS_PX}">
  <path d="${shape.safePath}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2" stroke-dasharray="10 8"/>
  <path d="${p.d}" fill="none" stroke="#000" stroke-width="1"/>
</svg>`;

    downloadBlob(`inscription-${projectId}-cut.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  };

  const downloadDxf = () => {
    if (!canExportCurves) return;
    const p = buildTextPathD();
    if (!p) return;

    const dxf = svgPathToDxf(p.d, mmPerPx);
    downloadBlob(`inscription-${projectId}-cut.dxf`, new Blob([dxf], { type: 'application/dxf' }));
  };

  const fitToSafe = () => {
    // Increase/decrease font size to fit within safe zone
    // Simple approach: binary search fontSizePx in [16, 140]
    const min = 16;
    const max = 140;
    let lo = min;
    let hi = max;
    let best = fontSizePx;

    const test = (fs: number) => {
      // approximate bbox scaling by ratio (fast) — we also force a measure after setting size
      const ratio = fs / fontSizePx;
      const w = bboxSize.w * ratio;
      const h = bboxSize.h * ratio;
      const halfW = w / 2;
      const halfH = h / 2;
      const pts: Point[] = [
        { x: pos.x - halfW, y: pos.y - halfH },
        { x: pos.x + halfW, y: pos.y - halfH },
        { x: pos.x + halfW, y: pos.y + halfH },
        { x: pos.x - halfW, y: pos.y + halfH }
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
    setFontSizePx(best);
  };

  return (
    <div className="section">
      <div className="section__head">
        <h1 className="section__title">Надпись онлайн</h1>
        <p className="section__subtitle">
          Сделайте макет надписи для шара, звезды или bubble. Перетащите текст, выберите шрифт и цвет, скачайте превью и
          файл для плоттера.
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

            <text
              ref={textRef}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontFamily={fontCss}
              fontSize={fontSizePx}
              letterSpacing={letterSpacing}
              style={{ cursor: 'grab', userSelect: 'none', touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {sanitizeText(text).split('\n').map((line, i) => (
                <tspan key={i} x={pos.x} dy={i === 0 ? 0 : fontSizePx * 1.15}>
                  {line}
                </tspan>
              ))}
            </text>

            {!insideNow ? (
              <>
                {corners.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r={6} fill="rgba(210,43,43,0.65)" />
                ))}
              </>
            ) : null}
          </svg>

          <div className="inscription__stats">
            <div className="kpi">
              <div className="kpi__label">ID макета</div>
              <div className="kpi__value">
                <code>{projectId}</code>
              </div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Размер надписи</div>
              <div className="kpi__value">
                {widthCm.toFixed(1)} × {heightCm.toFixed(1)} см
              </div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Площадь (оценка)</div>
              <div className="kpi__value">{areaCm2.toFixed(1)} см²</div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Вес (оценка)</div>
              <div className="kpi__value">
                {weightG.toFixed(2)} г / лимит {payloadLimit.toFixed(2)} г{' '}
                {payloadOk ? <span className="ok">OK</span> : <span className="bad">Слишком много</span>}
              </div>
            </div>

            <div className="kpi">
              <div className="kpi__label">Безопасная зона</div>
              <div className="kpi__value">
                {insideNow ? <span className="ok">Текст в зоне</span> : <span className="bad">Выходит за границы</span>}
              </div>
            </div>

            <div className="hero__actions" style={{ marginTop: 10, flexWrap: 'wrap' }}>
              <Button onClick={downloadPreviewPng} type="button" variant="secondary">
                Скачать превью (PNG)
              </Button>
              <Button onClick={downloadSvg} type="button" variant="ghost">
                Скачать SVG
              </Button>
              <Button onClick={downloadStateJson} type="button" variant="ghost">
                Сохранить (JSON)
              </Button>
            </div>

            <div className="hero__actions" style={{ marginTop: 10, flexWrap: 'wrap' }}>
              <Button onClick={downloadCutSvgCurves} type="button" variant="primary" disabled={!canExportCurves}>
                SVG (кривые)
              </Button>
              <Button onClick={downloadDxf} type="button" variant="primary" disabled={!canExportCurves}>
                DXF (для Silhouette)
              </Button>
            </div>

            <p className="muted" style={{ marginTop: 10 }}>
              Для экспорта “кривыми” загрузите TTF/OTF шрифт. Формат <b>.studio3</b> является закрытым; для Silhouette
              Studio используйте DXF (обычно поддерживается), либо SVG (обычно требует Business Edition).
            </p>
          </div>
        </div>

        <div className="panel inscription__controls">
          <div className="form">
            <label className="field">
              <span className="field__label">Изделие</span>
              <select
                className="field__control"
                value={product}
                onChange={(e) => {
                  const p = e.target.value as ProductType;
                  setProduct(p);
                  setSizeCm(PRODUCT_SIZES_CM[p][0]);
                  setPos({ x: CANVAS_PX / 2, y: CANVAS_PX / 2 });
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
              <select className="field__control" value={sizeCm} onChange={(e) => setSizeCm(Number(e.target.value))}>
                {PRODUCT_SIZES_CM[product].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Текст (до {MAX_LINES} строк / {MAX_CHARS} символов)</span>
              <textarea
                className="field__control"
                rows={5}
                value={text}
                onChange={(e) => setText(sanitizeText(e.target.value))}
                placeholder="Например: С ДНЁМ\nРОЖДЕНИЯ"
              />
            </label>

            <div className="grid inscription__grid">
              <label className="field">
                <span className="field__label">Шрифт (предпросмотр)</span>
                <select className="field__control" value={fontPresetId} onChange={(e) => setFontPresetId(e.target.value)}>
                  {FONT_PRESETS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                  <option value="uploaded">Загруженный шрифт</option>
                </select>
              </label>

              <label className="field">
                <span className="field__label">Загрузить TTF/OTF (для “кривых”)</span>
                <input className="field__control" type="file" accept=".ttf,.otf" onChange={(e) => onUploadFont(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            {loadedFont ? (
              <div className="muted" style={{ marginTop: 4 }}>
                Загружен шрифт: <b>{loadedFont.fileName}</b>
              </div>
            ) : null}

            <div className="grid inscription__grid" style={{ marginTop: 12 }}>
              <label className="field">
                <span className="field__label">Размер шрифта</span>
                <input
                  className="field__control"
                  type="range"
                  min={16}
                  max={140}
                  value={fontSizePx}
                  onChange={(e) => setFontSizePx(Number(e.target.value))}
                />
                <div className="muted">{fontSizePx}px</div>
              </label>

              <label className="field">
                <span className="field__label">Трекинг</span>
                <input
                  className="field__control"
                  type="range"
                  min={-2}
                  max={10}
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                />
                <div className="muted">{letterSpacing}px</div>
              </label>
            </div>

            <div className="grid inscription__grid" style={{ marginTop: 12 }}>
              <label className="field">
                <span className="field__label">Цвет надписи</span>
                <input className="field__control" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>

              <label className="field">
                <span className="field__label">Материал</span>
                <select className="field__control" value={materialId} onChange={(e) => setMaterialId(e.target.value as any)}>
                  {MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="swatches">
              {COLOR_PRESETS.map((c) => (
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

            <div className="grid inscription__grid" style={{ marginTop: 12 }}>
              <label className="field">
                <span className="field__label">Коэф. площади (эвристика)</span>
                <input
                  className="field__control"
                  type="range"
                  min={0.35}
                  max={0.75}
                  step={0.01}
                  value={coverage}
                  onChange={(e) => setCoverage(Number(e.target.value))}
                />
                <div className="muted">{coverage.toFixed(2)}</div>
              </label>

              <div className="field">
                <span className="field__label">Инструменты</span>
                <div className="hero__actions" style={{ alignItems: 'center' }}>
                  <Button onClick={fitToSafe} type="button" variant="secondary">
                    Вписать в зону
                  </Button>
                  <label className="toggle">
                    <input type="checkbox" checked={showSafeZone} onChange={(e) => setShowSafeZone(e.target.checked)} />
                    <span>Показать зону</span>
                  </label>
                </div>
              </div>
            </div>

            <label className="field" style={{ marginTop: 12 }}>
              <span className="field__label">Импорт ранее сохранённого JSON</span>
              <input className="field__control" type="file" accept=".json" onChange={(e) => importStateJson(e.target.files?.[0] ?? null)} />
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pathToD(path: any): string {
  if (!path || !path.commands) return '';
  return path.commands
    .map((c: any) => {
      if (c.type === 'M') return `M ${c.x} ${c.y}`;
      if (c.type === 'L') return `L ${c.x} ${c.y}`;
      if (c.type === 'C') return `C ${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
      if (c.type === 'Q') return `Q ${c.x1} ${c.y1} ${c.x} ${c.y}`;
      if (c.type === 'Z') return 'Z';
      return '';
    })
    .join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function measureLineWidth(font: any, line: string, scale: number, letterSpacingPx: number): number {
  const glyphs = font.stringToGlyphs(line);
  let w = 0;
  for (const g of glyphs) {
    const adv = (g.advanceWidth || 500) * scale;
    w += adv + letterSpacingPx;
  }
  return glyphs.length ? w - letterSpacingPx : 0;
}

// --- DXF export ---
// Very small DXF writer: converts SVG path commands to LWPOLYLINE by flattening curves.
// It is “best-effort”: Silhouette Studio usually imports DXF, but may require manual scaling.
function svgPathToDxf(pathD: string, mmPerPx: number): string {
  const subpaths = flattenPathToPolylines(pathD, 18).map((pts) =>
    pts.map((p) => ({ x: p.x * mmPerPx, y: p.y * mmPerPx }))
  );

  const lines: string[] = [];
  lines.push('0', 'SECTION', '2', 'HEADER', '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'TABLES', '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  for (const pts of subpaths) {
    if (pts.length < 2) continue;
    lines.push('0', 'LWPOLYLINE');
    lines.push('8', 'CUT'); // layer
    lines.push('90', String(pts.length));
    lines.push('70', '1'); // closed
    for (const p of pts) {
      lines.push('10', p.x.toFixed(3));
      lines.push('20', (-p.y).toFixed(3)); // invert Y to match CAD coords
    }
  }

  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');
  return lines.join('\n');
}

type V = { x: number; y: number };

function flattenPathToPolylines(d: string, curveSegments: number): V[][] {
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
  const result: V[][] = [];
  let current: V[] = [];

  const nextNumber = () => Number(tokens[i++]);

  const flush = () => {
    if (current.length) result.push(current);
    current = [];
  };

  while (i < tokens.length) {
    const t = tokens[i++];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      if (cmd === 'Z' || cmd === 'z') {
        if (current.length) {
          current.push({ x: sx, y: sy });
          flush();
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
      flush();
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
