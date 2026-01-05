import { requireAdmin } from '@/lib/admin-auth';
import { site } from '@/content/site';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="section">
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="adminHead__row">
          <div className="adminHead__meta">
            <div className="section__title" style={{ margin: 0 }}>
              Админ-панель {site.name}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              Управление категориями, фото, шрифтами и экспортами.
            </div>
          </div>
          <form method="post" action="/yakauleu/logout" className="adminHead__actions">
            <button className="btn btn--secondary" type="submit">
              Выйти
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
