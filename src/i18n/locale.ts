import { catalogs, defaultLocale, locales, type Locale } from './catalogs';

const teacherGuideBaseUrl =
  'https://batterycat.gitbook.io/message-unpacked-docs/';

const teacherGuidePaths = {
  'zh-TW': {
    home: '',
    privacy: 'shi-yong-fan-wei-yin-si-yu-wai-bu-fu-wu',
  },
  en: {
    home: 'en/',
    privacy: 'en/scope-privacy-and-external-services',
  },
} as const satisfies Record<Locale, { home: string; privacy: string }>;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getCatalog(locale: Locale) {
  return catalogs[locale];
}

export function teacherGuideUrl(locale: Locale): string {
  return `${teacherGuideBaseUrl}${teacherGuidePaths[locale].home}`;
}

export function teacherGuidePrivacyUrl(locale: Locale): string {
  return `${teacherGuideBaseUrl}${teacherGuidePaths[locale].privacy}`;
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

export function localeTeacherActivityPath(
  locale: Locale,
  basePath = import.meta.env.BASE_URL,
): string {
  return `${localeTeacherPath(locale, basePath)}activity/`;
}

export function localeClassroomHostPath(
  locale: Locale,
  basePath = import.meta.env.BASE_URL,
): string {
  return `${localePath(locale, basePath)}classroom/host/`;
}

export function localeClassroomJoinPath(
  locale: Locale,
  basePath = import.meta.env.BASE_URL,
): string {
  return `${localePath(locale, basePath)}classroom/join/`;
}

export function resolveLocale(value: string | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}
