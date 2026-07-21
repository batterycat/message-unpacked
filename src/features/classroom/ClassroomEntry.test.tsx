import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { getCatalog } from '../../i18n/locale';
import { ClassroomEntry } from './ClassroomEntry';
import { StaticActivityEntry } from './StaticActivityEntry';

describe('ClassroomEntry', () => {
  afterEach(() => cleanup());

  it('links to base-aware host and join routes when the service is configured', () => {
    render(
      <ClassroomEntry
        catalog={getCatalog('zh-TW')}
        hasReviewedCases
        hostPath="/message-unpacked/zh-TW/classroom/host/"
        isServiceConfigured
        joinPath="/message-unpacked/zh-TW/classroom/join/"
        switchLocaleHostPath="/message-unpacked/zh-TW/classroom/host/"
      />,
    );

    expect(
      screen.getByRole('heading', { name: '即時班級互動' }),
    ).toBeInTheDocument();
    expect(screen.getByText('已設定班級服務')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '建立互動教室' })).toHaveAttribute(
      'href',
      '/message-unpacked/zh-TW/classroom/host/',
    );
    expect(screen.getByRole('link', { name: '學生加入教室' })).toHaveAttribute(
      'href',
      '/message-unpacked/zh-TW/classroom/join/',
    );
  });

  it('keeps the live action unavailable when no room service is configured', () => {
    render(
      <ClassroomEntry
        catalog={getCatalog('zh-TW')}
        hasReviewedCases
        hostPath="/zh-TW/classroom/host/"
        isServiceConfigured={false}
        joinPath="/zh-TW/classroom/join/"
        switchLocaleHostPath="/zh-TW/classroom/host/"
      />,
    );

    expect(screen.getByText('尚未設定班級服務')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '建立互動教室' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: '學生加入教室' })).toBeNull();
    expect(screen.getByText(/靜態活動連結仍可正常使用/)).toBeInTheDocument();
  });

  it('offers a locale fallback when a build has no reviewed English cases', () => {
    render(
      <ClassroomEntry
        catalog={getCatalog('en')}
        hasReviewedCases={false}
        hostPath="/en/classroom/host/"
        isServiceConfigured
        joinPath="/en/classroom/join/"
        switchLocaleHostPath="/zh-TW/classroom/host/"
      />,
    );

    expect(
      screen.getByText(
        'No reviewed English classroom cases are available in this build',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Switch to Chinese classroom' }),
    ).toHaveAttribute('href', '/zh-TW/classroom/host/');
    expect(screen.queryByRole('link', { name: 'Start a live classroom' })).toBe(
      null,
    );
  });
});

describe('StaticActivityEntry', () => {
  afterEach(() => cleanup());

  it('presents the backend-free setup as a comparable teaching path', () => {
    render(
      <StaticActivityEntry
        catalog={getCatalog('zh-TW')}
        hasReviewedCases
        setupPath="/message-unpacked/zh-TW/teacher/activity/"
        switchLocaleSetupPath="/message-unpacked/zh-TW/teacher/activity/"
      />,
    );

    expect(
      screen.getByRole('heading', { name: '靜態活動連結' }),
    ).toBeInTheDocument();
    expect(screen.getByText('免設定後端，隨時可用')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /設定靜態活動/ })).toHaveAttribute(
      'href',
      '/message-unpacked/zh-TW/teacher/activity/',
    );
  });
});
