import { ConstructorClient } from './ConstructorClient';

export default function ConstructorPage({ searchParams }: { searchParams: { type?: string } }) {
  return (
    <section className="section">
      <div className="section__head">
        <h1 className="section__title">Конструктор заявки</h1>
        <p className="section__subtitle">
          Заполните поля — мы сформируем текст, который можно сразу отправить в Instagram или Telegram.
        </p>
      </div>

      <ConstructorClient initialType={searchParams.type} />
    </section>
  );
}
