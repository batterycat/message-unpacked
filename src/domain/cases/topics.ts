export const topicIds = [
  'family-life',
  'investment-advertising',
  'school-learning',
  'social-relationships',
  'online-shopping',
  'gaming-accounts',
] as const;

export type TopicId = (typeof topicIds)[number];
