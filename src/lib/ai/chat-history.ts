import { suggestCollectionName } from './chat-passages';

/**
 * Saved AI Chat conversations, kept on this device in localStorage.
 * Only the text is stored; verse cards are rebuilt from the bundled WEB text
 * when a chat is reopened.
 */

const STORAGE_KEY = 'biblequest-ai-chats-v1';
/** Fired on window when saved chats change in this tab. */
export const CHAT_HISTORY_EVENT = 'biblequest-ai-chats-change';
/** Only the most recently updated chats are kept. */
export const MAX_SAVED_CHATS = 20;

export interface SavedTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  stopped?: boolean;
}

export interface SavedChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: SavedTurn[];
}

function isSavedTurn(t: unknown): t is SavedTurn {
  if (!t || typeof t !== 'object') return false;
  const turn = t as Partial<SavedTurn>;
  return (
    typeof turn.id === 'string' &&
    (turn.role === 'user' || turn.role === 'assistant') &&
    typeof turn.content === 'string'
  );
}

function isSavedChat(c: unknown): c is SavedChat {
  if (!c || typeof c !== 'object') return false;
  const chat = c as Partial<SavedChat>;
  return (
    typeof chat.id === 'string' &&
    typeof chat.title === 'string' &&
    typeof chat.createdAt === 'number' &&
    typeof chat.updatedAt === 'number' &&
    Array.isArray(chat.turns)
  );
}

/** Saved chats, most recently updated first. */
export function getSavedChats(): SavedChat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSavedChat)
      .map((c) => ({ ...c, turns: c.turns.filter(isSavedTurn) }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getSavedChat(id: string): SavedChat | undefined {
  return getSavedChats().find((c) => c.id === id);
}

function persist(chats: SavedChat[]): SavedChat[] {
  const kept = [...chats].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SAVED_CHATS);
  try {
    if (kept.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage full or blocked: the chat still works for this session.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHAT_HISTORY_EVENT));
  return kept;
}

/**
 * Saves (or updates) a conversation. Chats without a question and empty
 * replies are not stored.
 */
export function saveChat(id: string, turns: SavedTurn[], now = Date.now()): SavedChat[] {
  const clean = turns
    .filter((t) => t.content.trim())
    .map(({ id: turnId, role, content, stopped }) => ({ id: turnId, role, content, ...(stopped ? { stopped } : {}) }));
  const chats = getSavedChats();
  if (!clean.some((t) => t.role === 'user')) return chats;

  const existing = chats.find((c) => c.id === id);
  const chat: SavedChat = {
    id,
    title: suggestCollectionName(clean),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    turns: clean,
  };
  return persist([chat, ...chats.filter((c) => c.id !== id)]);
}

export function deleteSavedChat(id: string): SavedChat[] {
  return persist(getSavedChats().filter((c) => c.id !== id));
}

export function clearSavedChats(): SavedChat[] {
  return persist([]);
}

export function newChatId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** "Today, 14:05" / "Yesterday" / "12 Nov" / "12 Nov 2025". */
export function formatChatDate(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (timestamp >= startOfToday) {
    return `Today, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (timestamp >= startOfToday - dayMs) return 'Yesterday';
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
