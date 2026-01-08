import Image from 'next/image';
import { ColorPickerField } from '@/components/ColorPickerField';
import { PRODUCT_LABEL } from '@/content/inscription';
import { EXPORT_RETENTION_DAYS, purgeExpiredExports } from '@/lib/exports';
import {
  getCategories,
  getCategoryImages,
  getColors,
  getDeletedCategories,
  getDeletedCategoryImages,
  getDeletedColors,
  getDeletedExports,
  getDeletedFonts,
  getExports,
  getFonts
} from '@/lib/data';
import { getDiskUsage } from '@/lib/files';
import { isSafePathSegment } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { searchParams?: Promise<{ tab?: string; section?: string }> };

const TABS = [
  { id: 'categories', label: 'Категории' },
  { id: 'fonts', label: 'Шрифты' },
  { id: 'colors', label: 'Цвета' },
  { id: 'exports', label: 'Экспорты' },
  { id: 'archive', label: 'Архив' }
] as const;

const ARCHIVE_SECTIONS = new Set(['categories', 'images', 'fonts', 'colors', 'exports']);

type ExportDetails = {
  clientName?: string;
  clientContact?: string;
  product?: string;
  sizeCm?: number;
  totalAreaCm2?: number;
  totalWeightG?: number;
  views?: Array<{
    id?: string;
    label?: string;
    areaCm2?: number;
    weightG?: number;
    layers?: Array<{
      id?: string;
      name?: string;
      text?: string;
      fontName?: string;
      fontSizePx?: number;
      lineHeightMult?: number;
      letterSpacing?: number;
      color?: string;
      widthCm?: number | null;
      heightCm?: number | null;
    }>;
  }>;
};

function parseExportDetails(raw: string): ExportDetails | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExportDetails;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default async function AdminPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const activeTab = TABS.find((tab) => tab.id === params.tab) ?? TABS[0];
  const sectionRaw = typeof params.section === 'string' ? params.section : '';
  const activeArchiveSection = ARCHIVE_SECTIONS.has(sectionRaw) ? sectionRaw : '';
  await purgeExpiredExports().catch(() => null);
  const diskUsage = await getDiskUsage(process.cwd()).catch(() => null);
  const [categories, fonts, colors, exportsList] = await Promise.all([
    getCategories({ includeHidden: true }).catch(() => []),
    getFonts({ includeHidden: true }).catch(() => []),
    getColors({ includeHidden: true }).catch(() => []),
    getExports().catch(() => [])
  ]);
  const [deletedCategories, deletedImages, deletedFonts, deletedColors, deletedExports] = await Promise.all([
    getDeletedCategories().catch(() => []),
    getDeletedCategoryImages().catch(() => []),
    getDeletedFonts().catch(() => []),
    getDeletedColors().catch(() => []),
    getDeletedExports().catch(() => [])
  ]);

  const categoriesWithImages = await Promise.all(
    categories.map(async (category) => ({
      category,
      images: await getCategoryImages(category.id, { includeHidden: true }).catch(() => [])
    }))
  );

  return (
    <div className="adminLayout">
      <nav className="adminTabs" aria-label="Разделы админки">
        {TABS.map((tab) => {
          const active = tab.id === activeTab.id;
          return (
            <a
              key={tab.id}
              href={`/yakauleu?tab=${tab.id}`}
              className={`adminTab ${active ? 'adminTab--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {tab.label}
            </a>
          );
        })}
      </nav>

      <div className="adminContent">
        {activeTab.id === 'categories' ? (
          <div className="panel">
            <h2 className="panel__title">Категории</h2>
            <form
              method="post"
              action="/yakauleu/api/categories/create"
              encType="multipart/form-data"
              className="form"
              style={{ marginBottom: 16 }}
            >
              <input type="hidden" name="tab" value="categories" />
              <div className="grid inscription__grid">
                <label className="field">
                  <span className="field__label">Название</span>
                  <input className="field__control" name="title" maxLength={190} required />
                </label>
                <label className="field">
                  <span className="field__label">URL (Slug)</span>
                  <input
                    className="field__control"
                    name="slug"
                    maxLength={80}
                    pattern="[a-z0-9_-]+"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                  />
                </label>
              </div>
              <label className="field">
                <span className="field__label">Описание</span>
                <textarea className="field__control" name="description" rows={3} maxLength={2000} />
              </label>
              <div className="grid inscription__grid">
                <label className="field">
                  <span className="field__label">Главное изображение (файл)</span>
                  <input
                    className="field__control"
                    name="hero_file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    required
                  />
                </label>
                <label className="field">
                  <span className="field__label">Позиция</span>
                  <input className="field__control" name="position" type="number" min={0} max={9999} defaultValue={0} />
                </label>
              </div>
              <label className="toggle" style={{ marginBottom: 12 }}>
                <input type="checkbox" name="visible" defaultChecked />
                <span>Показывать</span>
              </label>
              <button className="btn btn--primary" type="submit">
                Добавить категорию
              </button>
            </form>

            <div className="list">
              {categoriesWithImages.map(({ category, images }) => (
                <details key={category.id} className="panel" style={{ background: 'transparent' }}>
                  <summary className="nav__link nav__link--summary">
                    {category.title} <span className="muted">({category.slug})</span>
                  </summary>

                  <form
                    method="post"
                    action="/yakauleu/api/categories/update"
                    encType="multipart/form-data"
                    className="form"
                    style={{ marginTop: 12 }}
                  >
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="tab" value="categories" />
                    <div className="grid inscription__grid">
                      <label className="field">
                        <span className="field__label">Название</span>
                        <input className="field__control" name="title" maxLength={190} defaultValue={category.title} required />
                      </label>
                      <label className="field">
                        <span className="field__label">Slug</span>
                        <input
                          className="field__control"
                          name="slug"
                          maxLength={80}
                          pattern="[a-z0-9_-]+"
                          autoCapitalize="none"
                          autoCorrect="off"
                          defaultValue={category.slug}
                          required
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span className="field__label">Описание</span>
                      <textarea
                        className="field__control"
                        name="description"
                        rows={3}
                        maxLength={2000}
                        defaultValue={category.description}
                      />
                    </label>
                    <div className="grid inscription__grid">
                      <label className="field">
                        <span className="field__label">Обновить главное изображение (файл)</span>
                        <input className="field__control" name="hero_file" type="file" accept=".jpg,.jpeg,.png,.webp,.gif" />
                      </label>
                      <label className="field">
                        <span className="field__label">Позиция</span>
                        <input className="field__control" name="position" type="number" min={0} max={9999} defaultValue={category.position} />
                      </label>
                    </div>
                    {category.heroImage ? (
                      <div className="adminHeroPreview">
                        <div className="adminHeroImage watermarked">
                          <Image src={category.heroImage} alt="" width={160} height={120} sizes="160px" />
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {category.heroImage}
                        </div>
                      </div>
                    ) : null}
                    <label className="toggle" style={{ marginBottom: 12 }}>
                      <input type="checkbox" name="visible" defaultChecked={category.visible} />
                      <span>Показывать</span>
                    </label>
                    <div className="hero__actions" style={{ justifyContent: 'flex-start' }}>
                      <button className="btn btn--secondary" type="submit">
                        Сохранить категорию
                      </button>
                      <button className="btn btn--ghost" type="submit" formAction="/yakauleu/api/categories/delete">
                        Удалить категорию
                      </button>
                    </div>
                  </form>

                  <form
                    method="post"
                    action="/yakauleu/api/images/upload"
                    encType="multipart/form-data"
                    className="form"
                    style={{ marginTop: 16 }}
                  >
                    <input type="hidden" name="category_id" value={category.id} />
                    <input type="hidden" name="tab" value="categories" />
                    <label className="field">
                      <span className="field__label">Добавить изображения</span>
                      <input className="field__control" type="file" name="files" accept=".jpg,.jpeg,.png,.webp,.gif" multiple />
                    </label>
                    <button className="btn btn--ghost" type="submit">
                      Загрузить фото
                    </button>
                  </form>

                  <div className="list" style={{ marginTop: 12 }}>
                    {images.length ? (
                      images.map((image) => (
                        <form
                          key={image.id}
                          method="post"
                          action="/yakauleu/api/images/update"
                          className="panel"
                          style={{ display: 'grid', gap: 10 }}
                        >
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="tab" value="categories" />
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div className="adminThumb watermarked">
                              <Image src={image.url} alt="" width={80} height={80} sizes="80px" style={{ objectFit: 'cover' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13 }}>{image.fileName}</div>
                              <div className="muted" style={{ fontSize: 12 }}>
                                {image.url}
                              </div>
                            </div>
                          </div>
                          <div className="grid inscription__grid">
                            <label className="field">
                              <span className="field__label">Позиция</span>
                              <input className="field__control" type="number" name="position" min={0} max={9999} defaultValue={image.position} />
                            </label>
                            <label className="toggle" style={{ marginTop: 22 }}>
                              <input type="checkbox" name="visible" defaultChecked={image.visible} />
                              <span>Показывать</span>
                            </label>
                          </div>
                          <div className="hero__actions" style={{ justifyContent: 'flex-start' }}>
                            <button className="btn btn--secondary" type="submit">
                              Сохранить фото
                            </button>
                            <button className="btn btn--ghost" type="submit" formAction="/yakauleu/api/images/delete">
                              Удалить
                            </button>
                          </div>
                        </form>
                      ))
                    ) : (
                      <div className="muted">Нет изображений.</div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab.id === 'fonts' ? (
          <div className="panel">
            <h2 className="panel__title">Шрифты</h2>
            <form
              method="post"
              action="/yakauleu/api/fonts/upload"
              encType="multipart/form-data"
              className="form"
              style={{ marginBottom: 16 }}
            >
              <input type="hidden" name="tab" value="fonts" />
              <div className="grid inscription__grid">
                <label className="field">
                  <span className="field__label">Название</span>
                  <input className="field__control" name="name" maxLength={190} required />
                </label>
                <label className="field">
                  <span className="field__label">Файл (TTF/OTF)</span>
                  <input className="field__control" type="file" name="file" accept=".ttf,.otf" required />
                </label>
              </div>
              <div className="grid inscription__grid">
                <label className="field">
                  <span className="field__label">Позиция</span>
                  <input className="field__control" name="position" type="number" min={0} max={9999} defaultValue={0} />
                </label>
                <label className="toggle" style={{ marginTop: 22 }}>
                  <input type="checkbox" name="visible" defaultChecked />
                  <span>Показывать</span>
                </label>
              </div>
              <button className="btn btn--primary" type="submit">
                Добавить шрифт
              </button>
            </form>

            <div className="list">
              {fonts.map((font) => (
                <form key={font.id} method="post" action="/yakauleu/api/fonts/update" className="panel" style={{ display: 'grid', gap: 10 }}>
                  <input type="hidden" name="id" value={font.id} />
                  <input type="hidden" name="tab" value="fonts" />
                  <div className="muted" style={{ fontSize: 12 }}>
                    Файл: {font.fileName}
                  </div>
                  <div className="grid inscription__grid">
                    <label className="field">
                      <span className="field__label">Название</span>
                      <input className="field__control" name="name" maxLength={190} defaultValue={font.name} required />
                    </label>
                    <label className="field">
                      <span className="field__label">Позиция</span>
                      <input className="field__control" type="number" name="position" min={0} max={9999} defaultValue={font.position} />
                    </label>
                  </div>
                  <label className="toggle" style={{ marginTop: 4 }}>
                    <input type="checkbox" name="visible" defaultChecked={font.visible} />
                    <span>Показывать</span>
                  </label>
                  <div className="hero__actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="btn btn--secondary" type="submit">
                      Сохранить
                    </button>
                    <button className="btn btn--ghost" type="submit" formAction="/yakauleu/api/fonts/delete">
                      Удалить
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab.id === 'colors' ? (
          <div className="panel">
            <h2 className="panel__title">Цвета наклеек</h2>
            <form method="post" action="/yakauleu/api/colors/create" className="form" style={{ marginBottom: 16 }}>
              <input type="hidden" name="tab" value="colors" />
              <div className="grid inscription__grid">
                <label className="field">
                  <span className="field__label">Название</span>
                  <input className="field__control" name="name" maxLength={190} required />
                </label>
                <label className="field">
                  <span className="field__label">Цвет</span>
                  <ColorPickerField name="value" defaultValue="#ffffff" />
                </label>
              </div>
              <div className="grid inscription__grid">
                <label className="field">
                  <span className="field__label">Позиция</span>
                  <input className="field__control" name="position" type="number" min={0} max={9999} defaultValue={0} />
                </label>
                <label className="toggle" style={{ marginTop: 22 }}>
                  <input type="checkbox" name="visible" defaultChecked />
                  <span>Показывать</span>
                </label>
              </div>
              <button className="btn btn--primary" type="submit">
                Добавить цвет
              </button>
            </form>

            <div className="list">
              {colors.map((color) => (
                <form key={color.id} method="post" action="/yakauleu/api/colors/update" className="panel" style={{ display: 'grid', gap: 10 }}>
                  <input type="hidden" name="id" value={color.id} />
                  <input type="hidden" name="tab" value="colors" />
                  <div className="grid inscription__grid">
                    <label className="field">
                      <span className="field__label">Название</span>
                      <input className="field__control" name="name" maxLength={190} defaultValue={color.name} required />
                    </label>
                    <label className="field">
                      <span className="field__label">Цвет</span>
                      <ColorPickerField name="value" defaultValue={color.value} />
                    </label>
                  </div>
                  <div className="grid inscription__grid">
                    <label className="field">
                      <span className="field__label">Позиция</span>
                      <input className="field__control" name="position" type="number" min={0} max={9999} defaultValue={color.position} />
                    </label>
                    <label className="toggle" style={{ marginTop: 22 }}>
                      <input type="checkbox" name="visible" defaultChecked={color.visible} />
                      <span>Показывать</span>
                    </label>
                  </div>
                  <div className="hero__actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="btn btn--secondary" type="submit">
                      Сохранить
                    </button>
                    <button className="btn btn--ghost" type="submit" formAction="/yakauleu/api/colors/delete">
                      Удалить
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab.id === 'exports' ? (
          <div className="panel">
            <h2 className="panel__title">Экспорты (SVG/DXF)</h2>
            <div className="list">
              {exportsList.length ? (
                exportsList.map((exp) => {
                  const details = parseExportDetails(exp.detailsJson);
                  const clientName = exp.clientName || details?.clientName || '';
                  const clientContact = exp.clientContact || details?.clientContact || '';
                  const productLabel =
                    PRODUCT_LABEL[exp.product as keyof typeof PRODUCT_LABEL] ?? exp.product;
                  const orderLabel =
                    clientName || clientContact
                      ? [clientName, clientContact].filter(Boolean).join(' • ')
                      : 'Без контакта';
                  const views = details?.views ?? [];

                  return (
                    <details key={exp.id} className="panel" style={{ background: 'transparent' }}>
                      <summary className="nav__link--summary nav__link--flex">
                        <div className="nav__link nav__link--summary">
                          {productLabel} • {exp.sizeCm} см <span className="muted">({orderLabel})</span>
                        </div>
                        <form method="post" action="/yakauleu/api/exports/delete">
                          <input type="hidden" name="id" value={exp.id} />
                          <input type="hidden" name="tab" value="exports" />
                          <button className="btn btn--secondary" type="submit">
                            Удалить
                          </button>
                        </form>
                      </summary>

                      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {new Date(exp.createdAt).toLocaleString('ru-RU')}
                        </div>
                        <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                          <div>
                            Фигура: {productLabel} • {exp.sizeCm} см
                          </div>
                          <div>Клиент: {clientName || '—'}</div>
                          <div>Контакт: {clientContact || '—'}</div>
                          <div>
                            Шрифт: {exp.fontName} • Цвет: {exp.color}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Сессия: {exp.sessionId} • ID: {exp.projectHash}
                          </div>
                        </div>

                        {views.length ? (
                          <div className="list">
                            {views.map((view) => {
                              const viewId = typeof view.id === 'string' && isSafePathSegment(view.id, 40) ? view.id : null;
                              return (
                                <div key={view.id ?? view.label} className="panel" style={{ display: 'grid', gap: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 600 }}>{view.label ?? view.id ?? 'Сторона'}</div>
                                    {viewId ? (
                                      <div className="hero__actions" style={{ marginLeft: 'auto' }}>
                                        <a
                                          className="btn btn--secondary"
                                          href={`/yakauleu/exports/${exp.id}?type=svg&view=${encodeURIComponent(viewId)}`}
                                        >
                                          SVG
                                        </a>
                                        <a
                                          className="btn btn--secondary"
                                          href={`/yakauleu/exports/${exp.id}?type=dxf&view=${encodeURIComponent(viewId)}`}
                                        >
                                          DXF
                                        </a>
                                      </div>
                                    ) : null}
                                  </div>
                                  {view.layers?.length ? (
                                    view.layers.map((layer) => (
                                      <div key={layer.id ?? layer.name} style={{ display: 'grid', gap: 4 }}>
                                        <div style={{ fontSize: 14 }}>{layer.name ?? 'Слой'}</div>
                                        <div className="muted" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
                                          {layer.text || '—'}
                                        </div>
                                        <div className="muted" style={{ fontSize: 12 }}>
                                          {layer.fontName ? `Шрифт: ${layer.fontName}` : null}
                                          {layer.fontSizePx ? ` • ${layer.fontSizePx}px` : ''}
                                          {layer.letterSpacing ? ` • трекинг ${layer.letterSpacing}px` : ''}
                                        </div>
                                        <div className="muted" style={{ fontSize: 12 }}>
                                          {layer.widthCm ? `Ширина: ${layer.widthCm} см` : 'Ширина: —'}
                                          {layer.heightCm ? ` • Высота: ${layer.heightCm} см` : ''}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="muted">Нет данных по слоям.</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="muted">Подробности надписи отсутствуют.</div>
                        )}
                      </div>
                    </details>
                  );
                })
              ) : (
                <div className="muted">Пока нет экспортов.</div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab.id === 'archive' ? (
          <div className="panel">
            <h2 className="panel__title">Архив удалённых данных</h2>
            <p className="muted">Удалённые элементы хранятся в базе с флагом и в папке `deleted`.</p>
            {diskUsage ? (
              <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                Диск: свободно {formatBytes(diskUsage.freeBytes)} из {formatBytes(diskUsage.totalBytes)}
              </div>
            ) : null}
            <div className="list">
              <details className="panel" style={{ background: 'transparent' }} open={activeArchiveSection === 'categories'}>
                <summary className="nav__link nav__link--summary">
                  Категории ({deletedCategories.length})
                </summary>
                <div className="list" style={{ marginTop: 12 }}>
                  {deletedCategories.length ? (
                    deletedCategories.map((category) => (
                      <div key={category.id} className="panel" style={{ display: 'grid', gap: 6 }}>
                        <div style={{ fontSize: 14 }}>
                          {category.title} <span className="muted">({category.slug})</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Удалено: {new Date(category.deletedAt).toLocaleString('ru-RU')}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Архив: /deleted/gallery/{category.slug}
                        </div>
                        <form method="post" action="/yakauleu/api/categories/restore">
                          <input type="hidden" name="id" value={category.id} />
                          <input type="hidden" name="tab" value="archive" />
                          <input type="hidden" name="section" value="categories" />
                          <button className="btn btn--secondary" type="submit">
                            Восстановить
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="muted">Удалённых категорий нет.</div>
                  )}
                </div>
              </details>

              <details className="panel" style={{ background: 'transparent' }} open={activeArchiveSection === 'images'}>
                <summary className="nav__link nav__link--summary">
                  Фото категорий ({deletedImages.length})
                </summary>
                <div className="list" style={{ marginTop: 12 }}>
                  {deletedImages.length ? (
                    deletedImages.map((image) => (
                      <div key={image.id} className="panel" style={{ display: 'grid', gap: 6 }}>
                        <div style={{ fontSize: 14 }}>
                          {image.fileName} <span className="muted">({image.categorySlug})</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Удалено: {new Date(image.deletedAt).toLocaleString('ru-RU')}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Архив: {image.url}
                        </div>
                        <form method="post" action="/yakauleu/api/images/restore">
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="tab" value="archive" />
                          <input type="hidden" name="section" value="images" />
                          <button className="btn btn--secondary" type="submit">
                            Восстановить
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="muted">Удалённых фото нет.</div>
                  )}
                </div>
              </details>

              <details className="panel" style={{ background: 'transparent' }} open={activeArchiveSection === 'fonts'}>
                <summary className="nav__link nav__link--summary">
                  Шрифты ({deletedFonts.length})
                </summary>
                <div className="list" style={{ marginTop: 12 }}>
                  {deletedFonts.length ? (
                    deletedFonts.map((font) => (
                      <div key={font.id} className="panel" style={{ display: 'grid', gap: 6 }}>
                        <div style={{ fontSize: 14 }}>{font.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Файл: {font.fileName}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Удалено: {new Date(font.deletedAt).toLocaleString('ru-RU')}
                        </div>
                        <div className="hero__actions" style={{ justifyContent: 'flex-start' }}>
                          <form method="post" action="/yakauleu/api/fonts/restore">
                            <input type="hidden" name="id" value={font.id} />
                            <input type="hidden" name="tab" value="archive" />
                            <input type="hidden" name="section" value="fonts" />
                            <button className="btn btn--secondary" type="submit">
                              Восстановить
                            </button>
                          </form>
                          <form method="post" action="/yakauleu/api/fonts/purge">
                            <input type="hidden" name="id" value={font.id} />
                            <input type="hidden" name="tab" value="archive" />
                            <input type="hidden" name="section" value="fonts" />
                            <button className="btn btn--ghost" type="submit">
                              Удалить навсегда
                            </button>
                          </form>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="muted">Удалённых шрифтов нет.</div>
                  )}
                </div>
              </details>

              <details className="panel" style={{ background: 'transparent' }} open={activeArchiveSection === 'colors'}>
                <summary className="nav__link nav__link--summary">
                  Цвета ({deletedColors.length})
                </summary>
                <div className="list" style={{ marginTop: 12 }}>
                  {deletedColors.length ? (
                    deletedColors.map((color) => (
                      <div key={color.id} className="panel" style={{ display: 'grid', gap: 6 }}>
                        <div style={{ fontSize: 14 }}>{color.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {color.value}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Удалено: {new Date(color.deletedAt).toLocaleString('ru-RU')}
                        </div>
                        <div className="hero__actions" style={{ justifyContent: 'flex-start' }}>
                          <form method="post" action="/yakauleu/api/colors/restore">
                            <input type="hidden" name="id" value={color.id} />
                            <input type="hidden" name="tab" value="archive" />
                            <input type="hidden" name="section" value="colors" />
                            <button className="btn btn--secondary" type="submit">
                              Восстановить
                            </button>
                          </form>
                          <form method="post" action="/yakauleu/api/colors/purge">
                            <input type="hidden" name="id" value={color.id} />
                            <input type="hidden" name="tab" value="archive" />
                            <input type="hidden" name="section" value="colors" />
                            <button className="btn btn--ghost" type="submit">
                              Удалить навсегда
                            </button>
                          </form>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="muted">Удалённых цветов нет.</div>
                  )}
                </div>
              </details>

              <details className="panel" style={{ background: 'transparent' }} open={activeArchiveSection === 'exports'}>
                <summary className="nav__link nav__link--summary">
                  Экспорты ({deletedExports.length})
                </summary>
                <div className="list" style={{ marginTop: 12 }}>
                  {deletedExports.length ? (
                    deletedExports.map((exp) => {
                      const productLabel =
                        PRODUCT_LABEL[exp.product as keyof typeof PRODUCT_LABEL] ?? exp.product;
                      const deletedAt = new Date(exp.deletedAt).getTime();
                      const expiresAt = deletedAt + EXPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
                      const msLeft = expiresAt - Date.now();
                      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
                      const isExpired = msLeft <= 0;
                      return (
                        <div key={exp.id} className="panel" style={{ display: 'grid', gap: 6 }}>
                          <div style={{ fontSize: 14 }}>
                            {productLabel} • {exp.sizeCm} см
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Удалено: {new Date(exp.deletedAt).toLocaleString('ru-RU')}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {isExpired ? 'Срок хранения истёк' : `Можно восстановить: ${daysLeft} дн.`}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Клиент: {exp.clientName || '—'} • Контакт: {exp.clientContact || '—'}
                          </div>
                          <div className="hero__actions" style={{ justifyContent: 'flex-start' }}>
                            {!isExpired ? (
                              <form method="post" action="/yakauleu/api/exports/restore">
                                <input type="hidden" name="id" value={exp.id} />
                                <input type="hidden" name="tab" value="archive" />
                                <input type="hidden" name="section" value="exports" />
                                <button className="btn btn--secondary" type="submit">
                                  Восстановить
                                </button>
                              </form>
                            ) : null}
                            <form method="post" action="/yakauleu/api/exports/purge">
                              <input type="hidden" name="id" value={exp.id} />
                              <input type="hidden" name="tab" value="archive" />
                              <input type="hidden" name="section" value="exports" />
                              <button className="btn btn--ghost" type="submit">
                                Удалить навсегда
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="muted">Удалённых экспортов нет.</div>
                  )}
                </div>
              </details>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
