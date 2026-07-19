import { createElement } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getCatalog } from '../i18n/locale';
import { TeacherConfigurator } from './TeacherConfigurator';

const candidates = [
  {
    id: 'case.social-a',
    learning: {
      stages: ['7-9'] as const,
      topic: '社群與交友',
      contexts: ['社群平台', '同儕互動'],
    },
  },
  {
    id: 'case.gaming',
    learning: {
      stages: ['7-9'] as const,
      topic: '遊戲與帳號',
      contexts: ['線上遊戲'],
    },
  },
  {
    id: 'case.social-b',
    learning: {
      stages: ['7-9'] as const,
      topic: '社群與交友',
      contexts: ['社群平台'],
    },
  },
];

describe('TeacherConfigurator', () => {
  it('creates a locale-preserving projector activity link from teacher choices', () => {
    window.history.replaceState({}, '', '/message-unpacked/zh-TW/');
    render(
      createElement(TeacherConfigurator, {
        catalog: getCatalog('zh-TW'),
        locale: 'zh-TW',
        scenarios: candidates,
      }),
    );

    const topicSelect = screen.getByLabelText('主題') as HTMLSelectElement;
    expect([...topicSelect.options].map((option) => option.value)).toEqual([
      '社群與交友',
      '遊戲與帳號',
    ]);
    fireEvent.change(topicSelect, {
      target: { value: '遊戲與帳號' },
    });
    fireEvent.change(screen.getByLabelText('活動時間'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByLabelText('教師投影帶領'));
    fireEvent.click(screen.getByRole('button', { name: '產生活動連結' }));

    const launchLink = screen.getByRole('link', { name: '開啟活動' });
    const url = new URL(launchLink.getAttribute('href') ?? '');
    expect(url.pathname).toBe('/message-unpacked/zh-TW/activity/');
    expect(url.searchParams.get('mode')).toBe('projector');
    expect(url.searchParams.get('cases')?.split(',')).toEqual([
      'case.gaming',
      'case.social-a',
      'case.social-b',
    ]);
    expect(
      screen.getByRole('img', { name: '活動 QR Code' }),
    ).toBeInTheDocument();
    expect(screen.getByText('掃描 QR Code 開啟')).toBeInTheDocument();
  });
});
