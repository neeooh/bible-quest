import { createAbortScope, type AbortScope } from './abort';
import { createNdjsonParser } from './ndjson';
import { AiError, type ChatMessage, type ChatStats, type OllamaModel } from './types';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

/** Quick calls (version, model list). */
const SHORT_TIMEOUT_MS = 8_000;
/** Waiting for a chat to start; includes loading the model into memory. */
const CHAT_START_TIMEOUT_MS = 120_000;
/** Maximum silence between streamed chunks once a reply has started. */
const CHAT_IDLE_TIMEOUT_MS = 60_000;

export interface ChatOptions {
  model: string;
  signal?: AbortSignal;
  /** Ollama model options, e.g. { temperature: 0.7 }. */
  options?: Record<string, unknown>;
}

interface OllamaChatChunk {
  message?: { role: string; content: string };
  done?: boolean;
  error?: string;
  eval_count?: number;
  eval_duration?: number;
  load_duration?: number;
}

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}


function toAiError(err: unknown, scope: AbortScope): AiError {
  if (err instanceof AiError) return err;
  if (scope.timedOut()) {
    return new AiError('timeout', 'Ollama took too long to respond.');
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new AiError('aborted', 'Request cancelled.');
  }
  if (err instanceof TypeError) {
    return new AiError('unreachable', 'Could not reach Ollama.');
  }
  if (err instanceof SyntaxError) {
    return new AiError('bad_response', 'Ollama sent a response the app could not read.');
  }
  return new AiError('bad_response', err instanceof Error ? err.message : String(err));
}

async function errorFromResponse(res: Response, model?: string): Promise<AiError> {
  let detail = '';
  try {
    const body = (await res.json()) as { error?: string };
    detail = body.error ?? '';
  } catch {
    // body was not JSON
  }
  if (res.status === 404 && (model || /not found/i.test(detail))) {
    return new AiError(
      'model_not_found',
      detail || `Model "${model}" is not installed.`,
      res.status,
    );
  }
  if (res.status === 403) {
    // Ollama rejects origins it doesn't trust with a plain 403.
    return new AiError('unreachable', 'Ollama refused the request from this site.', 403);
  }
  return new AiError(
    'bad_response',
    detail || `Ollama returned HTTP ${res.status}.`,
    res.status,
  );
}

async function getJson<T>(baseUrl: string, path: string, signal?: AbortSignal): Promise<T> {
  const scope = createAbortScope(signal);
  scope.startTimer(SHORT_TIMEOUT_MS);
  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, { signal: scope.signal });
    if (!res.ok) throw await errorFromResponse(res);
    return (await res.json()) as T;
  } catch (err) {
    throw toAiError(err, scope);
  } finally {
    scope.dispose();
  }
}

export async function getVersion(baseUrl: string, signal?: AbortSignal): Promise<string> {
  const data = await getJson<{ version?: string }>(baseUrl, '/api/version', signal);
  if (typeof data.version !== 'string') {
    throw new AiError('bad_response', 'This does not look like an Ollama server.');
  }
  return data.version;
}

export async function listModels(baseUrl: string, signal?: AbortSignal): Promise<OllamaModel[]> {
  const data = await getJson<{
    models?: { name: string; size: number; details?: { parameter_size?: string; family?: string } }[];
  }>(baseUrl, '/api/tags', signal);
  if (!Array.isArray(data.models)) {
    throw new AiError('bad_response', 'This does not look like an Ollama server.');
  }
  return data.models
    .map((m) => ({
      name: m.name,
      size: m.size,
      parameterSize: m.details?.parameter_size,
      family: m.details?.family,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Streams a chat reply from Ollama. Yields text as it arrives and returns
 * Ollama's timing stats when the reply is complete.
 */
export async function* chatStream(
  baseUrl: string,
  messages: ChatMessage[],
  { model, signal, options }: ChatOptions,
): AsyncGenerator<string, ChatStats> {
  const scope = createAbortScope(signal);
  scope.startTimer(CHAT_START_TIMEOUT_MS);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true, options }),
      signal: scope.signal,
    });
    if (!res.ok) throw await errorFromResponse(res, model);
    if (!res.body) throw new AiError('bad_response', 'Ollama sent an empty response.');

    reader = res.body.getReader();
    const decoder = new TextDecoder();
    const parser = createNdjsonParser<OllamaChatChunk>();
    let stats: ChatStats = {};

    const handle = (chunk: OllamaChatChunk): string => {
      if (chunk.error) throw new AiError('bad_response', chunk.error);
      if (chunk.done) {
        stats = {
          evalCount: chunk.eval_count,
          evalDuration: chunk.eval_duration,
          loadDuration: chunk.load_duration,
        };
      }
      return chunk.message?.content ?? '';
    };

    while (true) {
      scope.startTimer(CHAT_IDLE_TIMEOUT_MS);
      const { done, value } = await reader.read();
      if (done) break;
      for (const chunk of parser.push(decoder.decode(value, { stream: true }))) {
        const text = handle(chunk);
        if (text) yield text;
      }
    }
    for (const chunk of parser.flush()) {
      const text = handle(chunk);
      if (text) yield text;
    }
    return stats;
  } catch (err) {
    throw toAiError(err, scope);
  } finally {
    scope.dispose();
    // Stops the download if the caller broke out of the loop early.
    reader?.cancel().catch(() => {});
  }
}
