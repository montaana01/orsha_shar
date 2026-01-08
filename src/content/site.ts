export const site = {
  name: 'ORSHA SHAR',
  legalName: 'Orsha Shar',
  defaultLocale: 'ru-BY',
  city: 'Орша',
  country: 'BY',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://orsha-shar.by',
  contacts: {
    phones: ['+375297107027', '+375298165088'],
    email: 'orsha.shar@gmail.com',
  },
  socials: {
    instagram: 'https://instagram.com/orsha_shar',
    instagramDm: 'https://ig.me/m/orsha_shar',
    vk: 'https://vk.com/orsha_shar',
    ok: 'https://ok.ru/orsha_shar',
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? 'https://t.me/orshashar',
  },
} as const;

export function telHref(phoneE164orLocal: string): string {
  const normalized = phoneE164orLocal.replace(/[\s()-]/g, '');
  return normalized.startsWith('+') ? `tel:${normalized}` : `tel:+${normalized}`;
}
