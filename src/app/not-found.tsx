import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="notFound">
      <div className="container notFound__inner">
        <div>
          <h1 className="notFound__title">Страница не найдена</h1>
          <p className="muted">Возможно, ссылка устарела или была введена с ошибкой.</p>
          <Link href="/" className="btn btn--primary">На главную</Link>
        </div>
        <Image src="/assets/404.webp" alt="404" width={560} height={420} className="notFound__img" />
      </div>
    </section>
  );
}
