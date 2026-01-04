import type { Metadata } from 'next';
import { InscriptionClient } from './InscriptionClient';

export const metadata: Metadata = {
  title: 'Конфигуратор надписи для фигуры',
  description:
    'Редактор надписи для шара, фольгированной звезды и bubble. Выбор шрифта/цвета и текста.'
};

export default function Page() {
  return <InscriptionClient />;
}
