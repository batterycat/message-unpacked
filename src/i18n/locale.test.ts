import { describe, expect, it } from 'vitest';

import {
  localeActivityPath,
  localeClassroomHostPath,
  localeClassroomJoinPath,
  localeTeacherActivityPath,
  localePath,
  localeTeacherPath,
} from './locale';

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
    expect(localeClassroomHostPath('zh-TW', '/message-unpacked/')).toBe(
      '/message-unpacked/zh-TW/classroom/host/',
    );
    expect(localeClassroomJoinPath('en', '/message-unpacked/')).toBe(
      '/message-unpacked/en/classroom/join/',
    );
    expect(localeTeacherActivityPath('zh-TW', '/message-unpacked/')).toBe(
      '/message-unpacked/zh-TW/teacher/activity/',
    );
  });

  it('normalizes root and unpadded base paths', () => {
    expect(localePath('zh-TW')).toBe('/zh-TW/');
    expect(localePath('zh-TW', '/')).toBe('/zh-TW/');
    expect(localePath('en', 'message-unpacked')).toBe('/message-unpacked/en/');
    expect(localeClassroomHostPath('en', '/')).toBe('/en/classroom/host/');
    expect(localeClassroomJoinPath('zh-TW', 'message-unpacked')).toBe(
      '/message-unpacked/zh-TW/classroom/join/',
    );
    expect(localeTeacherActivityPath('en', '/')).toBe('/en/teacher/activity/');
  });
});
