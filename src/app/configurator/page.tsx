import { ConfiguratorClient } from './ConfiguratorClient';
import { getPublicCategories } from '@/lib/public-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PageProps = { searchParams?: Promise<{ type?: string }> };

export default async function ConfiguratorPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const type = params.type ?? undefined;
  const categories = await getPublicCategories();
  return (
    <section className="section">
      <div className="section__head">
        <h1 className="section__title">Конфигуратор заявки</h1>
        <p className="section__subtitle">
          Заполните поля — мы сформируем текст, который можно сразу отправить в Instagram или
          Telegram.
        </p>
      </div>

      <ConfiguratorClient initialType={type} categories={categories} />
    </section>
  );
}
