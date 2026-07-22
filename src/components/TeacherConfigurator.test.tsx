import { createElement } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCatalog } from '../i18n/locale';
import type { CasePickerScenario } from '../features/classroom/CasePicker';
import { TeacherConfigurator } from './TeacherConfigurator';

const candidates = [
  {
    id: 'case.social-a',
    title: '社群邀請',
    channel: 'chat',
    contentVersion: '1.1.0',
    learning: {
      stages: ['7-9'] as const,
      topicId: 'social-relationships',
      topic: '社群與交友',
      contexts: ['社群平台', '同儕互動'],
      sensitiveContent: ['陌生人私訊', '情緒操控'],
      trustedAdultRecommended: true,
    },
  },
  {
    id: 'case.gaming',
    title: '遊戲帳號',
    channel: 'email',
    contentVersion: '1.1.0',
    learning: {
      stages: ['7-9'] as const,
      topicId: 'gaming-accounts',
      topic: '遊戲與帳號',
      contexts: ['線上遊戲'],
      sensitiveContent: ['帳號盜用'],
      trustedAdultRecommended: false,
    },
  },
  {
    id: 'case.social-b',
    title: '社群投票',
    channel: 'sms',
    contentVersion: '1.1.0',
    learning: {
      stages: ['7-9'] as const,
      topicId: 'social-relationships',
      topic: '社群與交友',
      contexts: ['社群平台'],
      sensitiveContent: [],
      trustedAdultRecommended: false,
    },
  },
  {
    id: 'case.primary',
    title: '低年級遊戲邀請',
    channel: 'chat',
    contentVersion: '1.1.0',
    learning: {
      stages: ['1-2'] as const,
      topicId: 'gaming-accounts',
      topic: '遊戲與帳號',
      contexts: ['線上遊戲'],
      sensitiveContent: ['陌生人接觸'],
      trustedAdultRecommended: true,
    },
  },
] as const satisfies readonly CasePickerScenario[];

const englishCandidates = [
  {
    id: 'case.social.en',
    title: 'Unexpected account message',
    channel: 'chat',
    contentVersion: '1.0.0',
    learning: {
      stages: ['10-12'] as const,
      topicId: 'social-relationships',
      topic: 'Social & Relationships',
      contexts: ['social media'],
      sensitiveContent: ['unexpected contact'],
      trustedAdultRecommended: true,
    },
  },
] as const satisfies readonly CasePickerScenario[];

describe('TeacherConfigurator', () => {
  afterEach(() => cleanup());

  it('creates a locale-preserving projector activity link from teacher choices', () => {
    window.history.replaceState({}, '', '/message-unpacked/zh-TW/');
    render(
      createElement(TeacherConfigurator, {
        catalog: getCatalog('zh-TW'),
        locale: 'zh-TW',
        scenarios: candidates,
      }),
    );

    const stageSelect = screen.getByLabelText('學習階段') as HTMLSelectElement;
    expect([...stageSelect.options].map((option) => option.value)).toEqual([
      '1-2',
      '3-4',
      '5-6',
      '7-9',
      '10-12',
    ]);
    const topicSelect = screen.getByLabelText('主題') as HTMLSelectElement;
    expect([...topicSelect.options].map((option) => option.value)).toEqual([
      'social-relationships',
      'gaming-accounts',
    ]);
    fireEvent.change(topicSelect, {
      target: { value: 'gaming-accounts' },
    });
    fireEvent.change(screen.getByLabelText('活動時間'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /社群投票/ }));
    fireEvent.click(screen.getByLabelText('教師投影帶領'));
    fireEvent.click(screen.getByRole('button', { name: '產生活動連結' }));

    const launchLink = screen.getByRole('link', { name: '開啟活動' });
    const url = new URL(launchLink.getAttribute('href') ?? '');
    expect(url.pathname).toBe('/message-unpacked/zh-TW/activity/');
    expect(url.searchParams.get('mode')).toBe('projector');
    expect(url.searchParams.get('activity')).toBe('2');
    expect(url.searchParams.get('topic')).toBe('gaming-accounts');
    expect(url.searchParams.get('versions')?.split(',')).toEqual([
      '1.1.0',
      '1.1.0',
    ]);
    expect(url.searchParams.get('cases')?.split(',')).toEqual([
      'case.gaming',
      'case.social-a',
    ]);
    expect(
      screen.getByRole('img', { name: '活動 QR Code' }),
    ).toBeInTheDocument();
    expect(screen.getByText('掃描 QR Code 開啟')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('學生自行練習'));
    expect(screen.queryByRole('img', { name: '活動 QR Code' })).toBeNull();
  });

  it('refreshes the editable recommendation when duration changes', () => {
    render(
      createElement(TeacherConfigurator, {
        catalog: getCatalog('zh-TW'),
        locale: 'zh-TW',
        scenarios: candidates,
      }),
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /社群投票/ }));
    expect(screen.getByText('已選 1／最多 10 題')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('活動時間'), {
      target: { value: '20' },
    });

    expect(screen.getByText('已選 3／最多 10 題')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /社群投票/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /遊戲帳號/ })).toBeChecked();
  });

  it('shows sensitive-content and trusted-adult guidance before case selection', () => {
    render(
      createElement(TeacherConfigurator, {
        catalog: getCatalog('zh-TW'),
        locale: 'zh-TW',
        scenarios: candidates,
      }),
    );

    expect(screen.getByText('敏感內容：陌生人私訊')).toBeInTheDocument();
    expect(screen.getByText('敏感內容：情緒操控')).toBeInTheDocument();
    expect(screen.getAllByText('建議由可信任的大人陪同')).not.toHaveLength(0);
  });

  it('focuses and scrolls the generated activity result into view', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    render(
      createElement(TeacherConfigurator, {
        catalog: getCatalog('zh-TW'),
        locale: 'zh-TW',
        scenarios: candidates,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: '產生活動連結' }));

    const result = screen.getByRole('status');
    expect(result).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'start' }),
    );
  });

  it('switches to another learning stage and uses its matching case', () => {
    window.history.replaceState({}, '', '/zh-TW/');
    render(
      createElement(TeacherConfigurator, {
        catalog: getCatalog('zh-TW'),
        locale: 'zh-TW',
        scenarios: candidates,
      }),
    );

    fireEvent.change(screen.getByLabelText('學習階段'), {
      target: { value: '1-2' },
    });
    expect(screen.getByLabelText('主題')).toHaveValue('gaming-accounts');
    fireEvent.click(screen.getByRole('button', { name: '產生活動連結' }));

    const launchLink = screen.getByRole('link', { name: '開啟活動' });
    const url = new URL(launchLink.getAttribute('href') ?? '');
    expect(url.searchParams.get('stage')).toBe('1-2');
    expect(url.searchParams.get('cases')).toBe('case.primary');
  });

  it('starts the English demo at its only published stage', () => {
    render(
      createElement(TeacherConfigurator, {
        catalog: getCatalog('en'),
        locale: 'en',
        scenarios: englishCandidates,
      }),
    );

    const stageSelect = screen.getByLabelText(
      'Learning stage',
    ) as HTMLSelectElement;
    expect(stageSelect).toHaveValue('10-12');
    expect([...stageSelect.options].map((option) => option.value)).toEqual([
      '10-12',
    ]);
    expect(screen.getByLabelText('Topic')).toHaveValue('social-relationships');
    expect(
      screen.getByRole('checkbox', { name: /Unexpected account message/ }),
    ).toBeChecked();
  });
});
