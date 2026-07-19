import { describe, expect, it } from 'vitest';

import { caseSchema } from './schema';

const validCase = {
  id: 'test.case.zh-tw',
  schemaVersion: 1,
  contentVersion: '1.0.0',
  translationGroupId: 'test.case',
  locale: 'zh-TW',
  status: 'published',
  title: '測試案例',
  channel: 'sms',
  classification: 'insufficient-evidence',
  provenance: { kind: 'fictional', note: '測試資料' },
  sources: [],
  learning: {
    stages: ['7-9'],
    dimensions: ['prevention'],
    topic: '測試主題',
    readingLevel: 'easy',
    difficulty: 'introductory',
    contexts: ['測試'],
    skills: ['查證'],
    riskTypes: ['測試'],
    sensitiveContent: [],
    trustedAdultRecommended: false,
  },
  messages: [
    {
      id: 'message.one',
      sender: '測試寄件者',
      body: '請先查證這則訊息。',
      direction: 'incoming',
    },
  ],
  clues: [{ id: 'clue.one', label: '線索', explanation: '說明' }],
  choices: [
    {
      id: 'choice.trustworthy',
      label: '可信',
      classification: 'trustworthy',
      reasoning: '回饋',
      score: 20,
    },
    {
      id: 'choice.fraud',
      label: '詐騙',
      classification: 'fraud',
      reasoning: '回饋',
      score: 20,
    },
    {
      id: 'choice.verify',
      label: '查證',
      classification: 'insufficient-evidence',
      reasoning: '回饋',
      score: 100,
    },
  ],
  recommendedActionIds: [],
  debrief: {
    headline: '先查證',
    explanation: '說明',
    safeActions: ['獨立查證'],
  },
  review: { lastReviewedAt: '2026-07-18', maintenanceStatus: 'active' },
} as const;

describe('caseSchema', () => {
  it('accepts a valid localized case', () => {
    expect(caseSchema.safeParse(validCase).success).toBe(true);
  });

  it('rejects raw HTML and live non-reserved links', () => {
    const result = caseSchema.safeParse({
      ...validCase,
      messages: [
        {
          ...validCase.messages[0],
          body: '<strong>快點</strong> https://real-suspicious.test/login',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsafe markup outside message fields too', () => {
    const result = caseSchema.safeParse({
      ...validCase,
      debrief: {
        ...validCase.debrief,
        explanation: '<img src=x onerror=alert(1)>',
      },
    });
    expect(result.success).toBe(false);
  });

  it('requires sources and impact for a documented case', () => {
    const result = caseSchema.safeParse({
      ...validCase,
      provenance: { kind: 'documented', note: '真實事件改編' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['sources', 'impact']),
      );
    }
  });
});
