import { describe, expect, it } from 'vitest';
import { collectChatPassages, suggestCollectionName } from './chat-passages';

const turns = [
  { id: 'u1', role: 'user' as const, content: "I'm feeling lonely." },
  { id: 'a1', role: 'assistant' as const, content: 'See Psalm 34:18 and Isaiah 41:10, also Psalm 23.' },
  { id: 'u2', role: 'user' as const, content: 'What about Romans 8:28?' },
  { id: 'a2', role: 'assistant' as const, content: 'Isaiah 41:10 again, and Romans 8:38-39.' },
  { id: 'a3', role: 'assistant' as const, content: 'Still typing John 3:16 …' },
];

describe('collectChatPassages', () => {
  it('lists each verse passage once, in order, with the reply it first appeared in', () => {
    expect(collectChatPassages(turns).map((p) => [p.key, p.turnId])).toEqual([
      ['psalms:34:18-18', 'a1'],
      ['isaiah:41:10-10', 'a1'],
      ['romans:8:38-39', 'a2'],
      ['john:3:16-16', 'a3'],
    ]);
  });

  it('ignores user messages, whole chapters and the reply still streaming', () => {
    const keys = collectChatPassages(turns, 'a3').map((p) => p.key);
    expect(keys).not.toContain('romans:8:28-28');
    expect(keys).not.toContain('psalms:23');
    expect(keys).not.toContain('john:3:16-16');
  });
});

describe('suggestCollectionName', () => {
  it('uses the first question, capitalised, without trailing punctuation', () => {
    expect(suggestCollectionName(turns)).toBe("I'm feeling lonely");
    expect(suggestCollectionName([{ id: 'u', role: 'user', content: 'how can I forgive?' }])).toBe('How can I forgive');
  });

  it('shortens long questions', () => {
    const name = suggestCollectionName([{ id: 'u', role: 'user', content: 'My mother died last month and I miss her so much every single day' }]);
    expect(name.length).toBeLessThanOrEqual(40);
    expect(name.endsWith('…')).toBe(true);
  });

  it('falls back when there is no question', () => {
    expect(suggestCollectionName([])).toBe('AI Chat passages');
  });
});
