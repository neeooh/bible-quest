import mentorPrompt from '../../../server/resources/prompts/mentor.txt?raw';
import { stripPetNameOpener } from './tone';
import type { ChatMessage } from './types';

/**
 * Prompt library. Bump a prompt's version whenever its wording changes, so
 * QA results (docs/200-local-llm-epic.md) can be tied to a version.
 */

export const MENTOR_PROMPT_VERSION = 'mentor-v2';

/**
 * The mentor's system prompt. The wording lives in one file shared with the
 * hosted AI server, which always sends its own copy; the app uses it for
 * local Ollama.
 */
export const MENTOR_SYSTEM_PROMPT = mentorPrompt.trim();

/** Full message list for a mentor chat: system prompt followed by the conversation. */
export function buildMentorMessages(history: ChatMessage[]): ChatMessage[] {
  return [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT },
    ...history
      .filter((m) => m.role !== 'system' && m.content.trim())
      // Don't feed earlier pet-name openers back, or the model copies them.
      .map((m) => (m.role === 'assistant' ? { ...m, content: stripPetNameOpener(m.content) } : m)),
  ];
}
