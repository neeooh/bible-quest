import { collectVerseRefs } from './message-format';
import { refKey, type ScriptureRef } from './scripture-guard';
import { stripPetNameOpener } from './tone';

export interface ChatPassageRef {
  /** refKey, also the passage key used by collections ("john:3:16-16"). */
  key: string;
  ref: ScriptureRef;
  /** The reply where the passage was first cited. */
  turnId: string;
}

interface TurnLike {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Every verse reference cited in the conversation, once each, in the order
 * they first appeared. A reply that is still streaming is skipped.
 */
export function collectChatPassages(turns: TurnLike[], streamingTurnId?: string): ChatPassageRef[] {
  const seen = new Set<string>();
  const out: ChatPassageRef[] = [];
  for (const turn of turns) {
    if (turn.role !== 'assistant' || turn.id === streamingTurnId) continue;
    for (const ref of collectVerseRefs(stripPetNameOpener(turn.content), false)) {
      const key = refKey(ref);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, ref, turnId: turn.id });
    }
  }
  return out;
}

const MAX_NAME_LENGTH = 40;

/** Suggested collection name, based on the first question in the chat. */
export function suggestCollectionName(turns: TurnLike[]): string {
  const first = turns.find((t) => t.role === 'user')?.content.trim().replace(/\s+/g, ' ');
  if (!first) return 'AI Chat passages';
  const clean = first.replace(/[?.!]+$/, '');
  const name = clean.length > MAX_NAME_LENGTH ? `${clean.slice(0, MAX_NAME_LENGTH - 1).trimEnd()}…` : clean;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
