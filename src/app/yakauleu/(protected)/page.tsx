import Image from 'next/image';
import { ColorPickerField } from '@/components/ColorPickerField';
import { getCategories, getCategoryImages, getColors, getExports, getFonts } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { searchParams?: Promise<{ tab?: string }> };

const TABS = [
  { id: 'categories', label: 'Категории' },
  { id: 'fonts', label: 'Шрифты' },
  { id: 'colors', label: 'Цвета' },
  { id: 'exports', label: 'Экспорты' }
] as const;

export default async function AdminPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const activeTab = TABS.find((tab) => tab.id === params.tab) ?? TABS[0];
  const [categories, fonts, colors, exportsList] = await Promise.all([
    getCategories({ includeHidden: true }).catch(() => []),
    getFonts({ includeHidden: true }).catch(() => []),
    getColors({ includeHidden: true }).catch(() => []),
    getExports().catch(() => [])
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
                  <summary className="nav__link nav__link--summary" style={{ cursor: 'pointer' }}>
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
                exportsList.map((exp) => (
                  <div key={exp.id} className="panel" style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 14 }}>
                          {exp.product} • {exp.sizeCm} см
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Сессия: {exp.sessionId} • ID: {exp.projectHash}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Шрифт: {exp.fontName} • Цвет: {exp.color}
                        </div>
                      </div>
                        <div className="hero__actions" style={{ flexWrap: 'wrap' }}>
                          <a className="btn btn--secondary" href={`/yakauleu/exports/${exp.id}?type=svg`}>
                            SVG
                          </a>
                          <a className="btn btn--secondary" href={`/yakauleu/exports/${exp.id}?type=dxf`}>
                            DXF
                          </a>
                          <form method="post" action="/yakauleu/api/exports/delete">
                            <input type="hidden" name="id" value={exp.id} />
                            <input type="hidden" name="tab" value="exports" />
                            <button className="btn btn--ghost" type="submit">
                              Удалить
                            </button>
                          </form>
                        </div>
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {new Date(exp.createdAt).toLocaleString('ru-RU')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted">Пока нет экспортов.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
