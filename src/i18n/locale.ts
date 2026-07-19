import { catalogs, defaultLocale, locales, type Locale } from './catalogs';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getCatalog(locale: Locale) {
  return catalogs[locale];
}

function normalizeBasePath(basePath: string): string {
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function localePath(
  locale: Locale,
  basePath = import.meta.env.BASE_URL,
): string {
  return `${normalizeBasePath(basePath)}${locale}/`;
}

export function localeActivityPath(
  locale: Locale,
  basePath = import.meta.env.BASE_URL,
): string {
  return `${localePath(locale, basePath)}activity/`;
}

export function localeTeacherPath(
  locale: Locale,
  basePath = import.meta.env.BASE_URL,
): string {
  return `${localePath(locale, basePath)}teacher/`;
}

export function resolveLocale(value: string | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}
