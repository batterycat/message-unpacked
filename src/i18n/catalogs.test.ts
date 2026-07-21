import { describe, expect, it } from 'vitest';

import { catalogs, locales } from './catalogs';

function leafEntries(value: object, prefix = ''): [string, string][] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === 'string'
      ? [[path, entry] as [string, string]]
      : leafEntries(entry as object, path);
  });
}

function placeholders(value: string): string[] {
  return Array.from(value.matchAll(/\{[^{}]+\}/g), (match) => match[0]).sort();
}

describe('interface catalogs', () => {
  it('provides the same complete key set for every supported locale', () => {
    const reference = leafEntries(catalogs['zh-TW']).map(([path]) => path);
    for (const locale of locales) {
      const entries = leafEntries(catalogs[locale]);
      expect(entries.map(([path]) => path)).toEqual(reference);
      for (const [path, value] of entries) {
        expect(value.trim(), `${locale}.${path}`).not.toBe('');
      }
    }
  });

  it('keeps interpolation placeholders aligned across translations', () => {
    const reference = Object.fromEntries(leafEntries(catalogs['zh-TW']));
    const translation = new Map(leafEntries(catalogs.en));

    for (const [path, value] of Object.entries(reference)) {
      const translatedValue = translation.get(path);
      expect(translatedValue, path).toBeDefined();
      if (translatedValue !== undefined) {
        expect(placeholders(translatedValue), path).toEqual(
          placeholders(value),
        );
      }
    }
  });

  it('does not publish Chinese case copy as an English placeholder', () => {
    expect(catalogs.en.demo.emptyDescription).toContain(
      'reviewed English cases',
    );
    expect(catalogs.en.classroomEntry.localeUnavailableDescription).toContain(
      'reviewed English cases',
    );
  });

  it('distinguishes static links from live classroom interaction', () => {
    expect(catalogs['zh-TW'].staticActivityEntry.heading).toContain('靜態');
    expect(catalogs['zh-TW'].classroomEntry.heading).toContain('班級互動');
    expect(catalogs.en.staticActivityEntry.heading).toContain('Static');
    expect(catalogs.en.classroomEntry.heading).toContain('classroom');
  });
});
