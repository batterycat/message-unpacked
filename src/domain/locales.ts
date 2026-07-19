export const supportedLocales = ['zh-TW', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'zh-TW';
