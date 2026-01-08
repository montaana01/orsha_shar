import { site } from '@/content/site';

export const metadata = {
  title: 'Вход в админку',
};

type Props = { searchParams?: Promise<{ error?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const hasError = params.error === '1';
  return (
    <div className="section">
      <div className="panel" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 className="section__title" style={{ marginTop: 0 }}>
          Админ-панель {site.name}
        </h1>
        <p className="muted">Войдите, чтобы управлять категориями, фото и шрифтами.</p>

        {hasError ? (
          <div className="notice notice--warn" role="status" style={{ marginBottom: 12 }}>
            Неверный email или пароль.
          </div>
        ) : null}

        <form method="post" action="/yakauleu/login/action" className="form">
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__control"
              type="email"
              name="email"
              maxLength={190}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Пароль</span>
            <input
              className="field__control"
              type="password"
              name="password"
              maxLength={128}
              required
            />
          </label>

          <button className="btn btn--primary" type="submit">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
