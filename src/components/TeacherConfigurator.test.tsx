import { createElement } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

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
});
