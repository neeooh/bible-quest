import { useCallback, useEffect, useRef, useState } from 'react';
import { getAiSettings, pickModel, saveAiSettings } from '../lib/ai/ai-settings';
import { chatStream, listModels } from '../lib/ai/ollama-client';
import { AiError, isAiError, type ChatMessage } from '../lib/ai/types';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Set when the reply failed. */
  error?: AiError;
  /** Set when the user pressed Stop. */
  stopped?: boolean;
}

/**
 * idle      – nothing in flight
 * waiting   – request sent, no text yet (includes loading the model)
 * streaming – text is arriving
 */
export type ChatPhase = 'idle' | 'waiting' | 'streaming';

export interface UseAiChatOptions {
  /** Turns the visible conversation into the messages sent to Ollama (e.g. adds a system prompt). */
  buildMessages: (history: ChatMessage[]) => ChatMessage[];
  /** When set, the conversation is kept in sessionStorage under this key. */
  sessionKey?: string;
}

let idCounter = 0;
const newId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

function loadTurns(key: string | undefined): ChatTurn[] {
  if (!key) return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatTurn[];
    if (!Array.isArray(parsed)) return [];
    // Errors don't survive JSON; keep the text only.
    return parsed
      .filter((t) => (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
      .map((t) => ({ id: t.id || newId(), role: t.role, content: t.content, stopped: t.stopped }));
  } catch {
    return [];
  }
}

function saveTurns(key: string | undefined, turns: ChatTurn[]) {
  if (!key) return;
  try {
    if (turns.length === 0) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(turns.map(({ error: _e, ...t }) => t)));
  } catch {
    // Storage unavailable; the chat still works in memory.
  }
}

/** Uses the saved model, or picks one (gemma3 first) and saves it. */
async function resolveModel(baseUrl: string, saved: string, signal: AbortSignal): Promise<string> {
  if (saved) return saved;
  const model = pickModel(await listModels(baseUrl, signal), saved);
  if (!model) {
    throw new AiError('model_not_found', 'No models are installed in Ollama yet.');
  }
  saveAiSettings({ model });
  return model;
}

/** A streaming chat with the local Ollama model. */
export function useAiChat({ buildMessages, sessionKey }: UseAiChatOptions) {
  const [turns, setTurns] = useState<ChatTurn[]>(() => loadTurns(sessionKey));
  const [phase, setPhase] = useState<ChatPhase>('idle');
  const controllerRef = useRef<AbortController | null>(null);
  const turnsRef = useRef(turns);
  const buildRef = useRef(buildMessages);

  useEffect(() => {
    turnsRef.current = turns;
    buildRef.current = buildMessages;
  });

  useEffect(() => {
    if (phase === 'idle') saveTurns(sessionKey, turns);
  }, [turns, phase, sessionKey]);

  // Cancel any reply in flight when the component goes away.
  useEffect(() => () => controllerRef.current?.abort(), []);

  /** Streams a reply to `history` (which must end with a user turn). */
  const run = useCallback(async (history: ChatTurn[]) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const reply: ChatTurn = { id: newId(), role: 'assistant', content: '' };
    setTurns([...history, reply]);
    setPhase('waiting');

    const update = (changes: Partial<ChatTurn>) =>
      setTurns((prev) => prev.map((t) => (t.id === reply.id ? { ...t, ...changes } : t)));

    let text = '';
    try {
      const settings = getAiSettings();
      const model = await resolveModel(settings.baseUrl, settings.model, controller.signal);
      const messages = buildRef.current(history.map(({ role, content }) => ({ role, content })));
      const stream = chatStream(settings.baseUrl, messages, {
        model,
        signal: controller.signal,
        options: { temperature: settings.temperature },
      });
      for await (const delta of stream) {
        if (!text) setPhase('streaming');
        text += delta;
        update({ content: text });
      }
    } catch (err) {
      const error = isAiError(err) ? err : new AiError('bad_response', String(err));
      if (error.code === 'aborted') update({ content: text, stopped: true });
      else update({ content: text, error });
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setPhase('idle');
      }
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || controllerRef.current) return;
      const userTurn: ChatTurn = { id: newId(), role: 'user', content };
      void run([...turnsRef.current, userTurn]);
    },
    [run],
  );

  /** Re-asks the last question, replacing the last reply. */
  const retry = useCallback(() => {
    if (controllerRef.current) return;
    const history = [...turnsRef.current];
    while (history.length && history[history.length - 1].role === 'assistant') history.pop();
    if (history.length) void run(history);
  }, [run]);

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setTurns([]);
    setPhase('idle');
  }, []);

  return { turns, phase, busy: phase !== 'idle', send, retry, stop, reset };
}
