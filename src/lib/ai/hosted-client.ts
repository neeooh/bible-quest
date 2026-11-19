import { createAbortScope, type AbortScope } from './abort';
import { getTurnstileToken } from './turnstile';
import { AiError, type AiErrorCode, type ChatMessage } from './types';

/**
 * Client for the BibleQuest AI API (the Laravel app in /server). Everyone can
 * use it without an account: the app gets an anonymous session token tied to
 * a random device id, and the server enforces the daily limits.
 */

/** e.g. "https://api.biblequest.example". Empty when the hosted AI isn't set up for this build. */
export const HOSTED_AI_URL = ((import.meta.env.VITE_AI_API_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/+$/, '');

const DEVICE_KEY = 'biblequest-device-id';
const SESSION_KEY = 'biblequest-ai-session-v1';
/** Fired on window with the latest {@link HostedQuota}. */
export const HOSTED_QUOTA_EVENT = 'biblequest-ai-quota';

const SESSION_TIMEOUT_MS = 30_000;
/** The whole reply arrives at once, so allow for the model writing it. */
const REPLY_TIMEOUT_MS = 90_000;

export interface HostedQuota {
  remainingToday: number;
  dailyLimit: number;
}

interface StoredSession {
  token: string;
  /** Unix seconds. */
  expiresAt: number;
}

export function isHostedAiConfigured(): boolean {
  return HOSTED_AI_URL !== '';
}

function newDeviceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // RFC 4122 v4 from Math.random, for very old browsers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** A random id for this browser, kept so daily limits follow the device. */
export function getDeviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_KEY);
    if (saved) return saved;
    const id = newDeviceId();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return newDeviceId();
  }
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    // Renew a minute early so a request doesn't expire on the way.
    if (typeof s.token !== 'string' || typeof s.expiresAt !== 'number') return null;
    return s.expiresAt * 1000 > Date.now() + 60_000 ? s : null;
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: the session lives for this request only.
  }
}

let lastQuota: HostedQuota | null = null;

/** The most recent remaining-messages count the server reported, if any. */
export function getLastQuota(): HostedQuota | null {
  return lastQuota;
}

function publishQuota(body: { remainingToday?: unknown; dailyLimit?: unknown }) {
  if (typeof body.remainingToday !== 'number' || typeof body.dailyLimit !== 'number') return;
  lastQuota = { remainingToday: body.remainingToday, dailyLimit: body.dailyLimit };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<HostedQuota>(HOSTED_QUOTA_EVENT, { detail: lastQuota }));
  }
}

/** Server error codes (server/app/Http/Controllers/Api) → app error codes. */
const SERVER_CODES: Record<string, AiErrorCode> = {
  rate_limited: 'rate_limited',
  daily_limit: 'daily_limit',
  resting: 'unavailable',
  busy: 'unavailable',
  unavailable: 'unavailable',
  bot_check_failed: 'bot_check',
  refused: 'refused',
};

async function errorFromResponse(res: Response): Promise<AiError> {
  let code = '';
  let message = '';
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string }; message?: string };
    code = body.error?.code ?? '';
    message = body.error?.message ?? body.message ?? '';
  } catch {
    // body was not JSON
  }
  const mapped = SERVER_CODES[code];
  if (mapped) return new AiError(mapped, message, res.status);
  if (res.status === 422) {
    return new AiError('bad_response', message || 'The message could not be sent.', res.status);
  }
  return new AiError('bad_response', message || `The AI service returned HTTP ${res.status}.`, res.status);
}

function toAiError(err: unknown, scope: AbortScope): AiError {
  if (err instanceof AiError) return err;
  if (scope.timedOut()) return new AiError('timeout', 'The AI mentor took too long to respond.');
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new AiError('aborted', 'Request cancelled.');
  }
  if (err instanceof TypeError) return new AiError('unreachable', 'Could not reach the AI service.');
  if (err instanceof SyntaxError) {
    return new AiError('bad_response', 'The AI service sent a response the app could not read.');
  }
  return new AiError('bad_response', err instanceof Error ? err.message : String(err));
}

async function postJson<T>(
  path: string,
  body: unknown,
  { signal, timeoutMs, token }: { signal?: AbortSignal; timeoutMs: number; token?: string },
): Promise<T> {
  const scope = createAbortScope(signal);
  scope.startTimer(timeoutMs);
  try {
    const res = await fetch(`${HOSTED_AI_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: scope.signal,
    });
    if (!res.ok) throw await errorFromResponse(res);
    return (await res.json()) as T;
  } catch (err) {
    throw toAiError(err, scope);
  } finally {
    scope.dispose();
  }
}

async function startSession(signal?: AbortSignal): Promise<string> {
  let turnstileToken: string;
  try {
    turnstileToken = await getTurnstileToken();
  } catch (err) {
    throw new AiError('bot_check', err instanceof Error ? err.message : 'The security check failed.');
  }
  const data = await postJson<StoredSession & HostedQuota>(
    '/api/v1/ai/session',
    { deviceId: getDeviceId(), turnstileToken: turnstileToken || undefined },
    { signal, timeoutMs: SESSION_TIMEOUT_MS },
  );
  writeSession({ token: data.token, expiresAt: data.expiresAt });
  publishQuota(data);
  return data.token;
}

async function getSessionToken(signal?: AbortSignal): Promise<string> {
  return readSession()?.token ?? startSession(signal);
}

/**
 * One reply from the hosted mentor. The server adds its own system prompt,
 * so any system messages here are dropped.
 */
export async function hostedMentorReply(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  const conversation = messages.filter((m) => m.role !== 'system');
  const send = async (token: string) =>
    postJson<{ reply: string } & HostedQuota>(
      '/api/v1/ai/mentor',
      { messages: conversation },
      { signal, timeoutMs: REPLY_TIMEOUT_MS, token },
    );

  let data: { reply: string } & HostedQuota;
  try {
    data = await send(await getSessionToken(signal));
  } catch (err) {
    // Expired or rejected session: get a fresh one and try once more.
    if (!(err instanceof AiError) || err.status !== 401) throw err;
    writeSession(null);
    data = await send(await startSession(signal));
  }
  publishQuota(data);
  if (typeof data.reply !== 'string') {
    throw new AiError('bad_response', 'The AI service sent a response the app could not read.');
  }
  return data.reply;
}
