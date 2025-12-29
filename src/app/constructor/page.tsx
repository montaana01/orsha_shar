'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConstructorClient } from './ConstructorClient';

function ConstructorPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? undefined;

  return (
    <section className="section">
      <div className="section__head">
        <h1 className="section__title">Конструктор заявки</h1>
        <p className="section__subtitle">
          Заполните поля — мы сформируем текст, который можно сразу отправить в Instagram или Telegram.
        </p>
      </div>

      <ConstructorClient initialType={type} />
    </section>
  );
}

export default function ConstructorPage() {
  return (
    <Suspense fallback={null}>
      <ConstructorPageContent />
    </Suspense>
  );
}
