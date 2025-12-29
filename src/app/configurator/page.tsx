'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfiguratorClient } from './ConfiguratorClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function ConfiguratorPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? undefined;
  return (
    <section className="section">
      <div className="section__head">
        <h1 className="section__title">Конфигуратор заявки</h1>
        <p className="section__subtitle">
          Заполните поля — мы сформируем текст, который можно сразу отправить в Instagram или Telegram.
        </p>
      </div>

      <ConfiguratorClient initialType={type} />
    </section>
  );
}

export default function ConfiguratorPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguratorPageContent />
    </Suspense>
  );
}
