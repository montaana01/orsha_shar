import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика cookies',
  description: 'Описание использования cookies на сайте ORSHA SHAR.'
};

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="section__head">
        <h1 className="section__title">Политика cookies</h1>
        <p className="section__subtitle">
          Мы не собираем и не храним персональные данные пользователей. Заказы принимаются в соцсетях.
        </p>
      </div>

      <div className="panel prose">
        <h2>Что такое cookies</h2>
        <p>
          Cookies — небольшие технические файлы, которые браузер сохраняет на устройстве. Они нужны для корректной работы сайта
          (например, чтобы работало меню и защиты от повторной отправки форм).
        </p>

        <h2>Какие cookies используются</h2>
        <ul>
          <li><strong>Технические</strong>: необходимые для работы сайта и защиты.</li>
          <li><strong>Аналитика</strong>: по умолчанию не используем. Если вы добавите аналитику (GA/Meta), добавьте баннер согласия.</li>
        </ul>

        <h2>Как отключить cookies</h2>
        <p>Вы можете отключить cookies в настройках браузера. Учтите, что некоторые функции сайта могут работать некорректно.</p>

        <h2>Контакты</h2>
        <p>
          По вопросам можно написать на почту: <a href="mailto:orsha.shar@gmail.com">orsha.shar@gmail.com</a>
        </p>
      </div>
    </section>
  );
}
