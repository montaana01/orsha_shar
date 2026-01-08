import type { Metadata } from 'next';
import { InscriptionClient } from './InscriptionClient';
import { getColors, getFonts } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Конфигуратор надписи для фигуры',
  description:
    'Редактор надписи для шара, фольгированной звезды, сердца, круга и bubble. Выбор шрифта/цвета и текста.'
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Page() {
  const [fonts, colors] = await Promise.all([getFonts().catch(() => []), getColors().catch(() => [])]);
  return <InscriptionClient fonts={fonts} colors={colors} />;
}
