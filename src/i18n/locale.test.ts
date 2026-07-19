import { describe, expect, it } from 'vitest';

import { localeActivityPath, localePath, localeTeacherPath } from './locale';

describe('localized application paths', () => {
  it('preserves an explicit static-host base path', () => {
    expect(localePath('zh-TW', '/message-unpacked/')).toBe(
      '/message-unpacked/zh-TW/',
    );
    expect(localePath('en', '/message-unpacked/')).toBe(
      '/message-unpacked/en/',
    );
    expect(localeActivityPath('en', '/message-unpacked/')).toBe(
      '/message-unpacked/en/activity/',
    );
    expect(localeTeacherPath('zh-TW', '/message-unpacked/')).toBe(
      '/message-unpacked/zh-TW/teacher/',
    );
  });

  it('normalizes root and unpadded base paths', () => {
    expect(localePath('zh-TW')).toBe('/zh-TW/');
    expect(localePath('zh-TW', '/')).toBe('/zh-TW/');
    expect(localePath('en', 'message-unpacked')).toBe('/message-unpacked/en/');
  });
});
