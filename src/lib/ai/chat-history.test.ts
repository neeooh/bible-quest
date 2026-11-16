import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHAT_HISTORY_EVENT,
  MAX_SAVED_CHATS,
  clearSavedChats,
  deleteSavedChat,
  formatChatDate,
  getSavedChat,
  getSavedChats,
  saveChat,
} from './chat-history';

const turns = (question: string, reply = 'Psalm 34:18 speaks to this.') => [
  { id: 'u', role: 'user' as const, content: question },
  { id: 'a', role: 'assistant' as const, content: reply },
];

beforeEach(() => localStorage.clear());

describe('saveChat', () => {
  it('saves a chat titled from its first question', () => {
    saveChat('c1', turns("I'm feeling lonely."), 1000);
    expect(getSavedChat('c1')).toMatchObject({
      id: 'c1',
      title: "I'm feeling lonely",
      createdAt: 1000,
      updatedAt: 1000,
      turns: [{ role: 'user' }, { role: 'assistant' }],
    });
  });

  it('updates an existing chat, keeping when it was created', () => {
    saveChat('c1', turns('First'), 1000);
    saveChat('c1', [...turns('First'), { id: 'u2', role: 'user', content: 'More?' }], 2000);
    const chat = getSavedChat('c1')!;
    expect(chat.createdAt).toBe(1000);
    expect(chat.updatedAt).toBe(2000);
    expect(chat.turns).toHaveLength(3);
    expect(getSavedChats()).toHaveLength(1);
  });

  it('lists the most recently updated chats first', () => {
    saveChat('old', turns('Old'), 1000);
    saveChat('new', turns('New'), 3000);
    saveChat('mid', turns('Mid'), 2000);
    expect(getSavedChats().map((c) => c.id)).toEqual(['new', 'mid', 'old']);
  });

  it(`keeps only the ${MAX_SAVED_CHATS} most recent chats`, () => {
    for (let i = 0; i < MAX_SAVED_CHATS + 3; i++) saveChat(`c${i}`, turns(`Q${i}`), i);
    const ids = getSavedChats().map((c) => c.id);
    expect(ids).toHaveLength(MAX_SAVED_CHATS);
    expect(ids).not.toContain('c0');
    expect(ids[0]).toBe(`c${MAX_SAVED_CHATS + 2}`);
  });

  it('skips chats without a question and drops empty replies', () => {
    saveChat('empty', [{ id: 'a', role: 'assistant', content: 'Hi' }]);
    expect(getSavedChats()).toEqual([]);
    saveChat('c', [...turns('Q'), { id: 'a2', role: 'assistant', content: '  ' }]);
    expect(getSavedChat('c')!.turns).toHaveLength(2);
  });

  it('notifies listeners', () => {
    const listener = vi.fn();
    window.addEventListener(CHAT_HISTORY_EVENT, listener);
    saveChat('c', turns('Q'));
    window.removeEventListener(CHAT_HISTORY_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('deleting', () => {
  it('deletes one chat or all of them', () => {
    saveChat('a', turns('A'), 1);
    saveChat('b', turns('B'), 2);
    deleteSavedChat('a');
    expect(getSavedChats().map((c) => c.id)).toEqual(['b']);
    clearSavedChats();
    expect(getSavedChats()).toEqual([]);
    expect(localStorage.getItem('biblequest-ai-chats-v1')).toBeNull();
  });
});

describe('getSavedChats', () => {
  it('ignores corrupt storage and malformed entries', () => {
    localStorage.setItem('biblequest-ai-chats-v1', '{oops');
    expect(getSavedChats()).toEqual([]);
    localStorage.setItem(
      'biblequest-ai-chats-v1',
      JSON.stringify([{ id: 'x' }, { id: 'ok', title: 'T', createdAt: 1, updatedAt: 1, turns: [{ id: 't', role: 'system', content: 'x' }] }]),
    );
    expect(getSavedChats()).toEqual([{ id: 'ok', title: 'T', createdAt: 1, updatedAt: 1, turns: [] }]);
  });
});

describe('formatChatDate', () => {
  const now = new Date(2026, 10, 15, 18, 0).getTime();
  it('formats today, yesterday and older dates', () => {
    expect(formatChatDate(new Date(2026, 10, 15, 9, 5).getTime(), now)).toBe('Today, 09:05');
    expect(formatChatDate(new Date(2026, 10, 14, 23, 0).getTime(), now)).toBe('Yesterday');
    expect(formatChatDate(new Date(2026, 10, 2).getTime(), now)).toBe('2 Nov');
    expect(formatChatDate(new Date(2025, 4, 2).getTime(), now)).toBe('2 May 2025');
  });
});
