import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNdjsonParser } from './ndjson';
import { chatStream, getVersion, listModels, normalizeBaseUrl } from './ollama-client';
import { AiError } from './types';
import { describeAiError } from './errors';

const BASE = 'http://localhost:11434';

/** Builds a streaming Response whose body arrives in the given raw pieces. */
function streamResponse(pieces: string[], init: ResponseInit = { status: 200 }): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of pieces) controller.enqueue(encoder.encode(p));
      controller.close();
    },
  });
  return new Response(body, init);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function collect(gen: AsyncGenerator<string, unknown>): Promise<{ text: string; result: unknown }> {
  let text = '';
  while (true) {
    const step = await gen.next();
    if (step.done) return { text, result: step.value };
    text += step.value;
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createNdjsonParser', () => {
  it('parses objects split across arbitrary chunk boundaries', () => {
    const parser = createNdjsonParser<{ n: number }>();
    const full = '{"n":1}\n{"n":2}\n{"n":3}';
    const out: { n: number }[] = [];
    for (const ch of full) out.push(...parser.push(ch));
    out.push(...parser.flush());
    expect(out.map((o) => o.n)).toEqual([1, 2, 3]);
  });

  it('ignores blank lines', () => {
    const parser = createNdjsonParser();
    expect(parser.push('\n\n{"a":1}\n\n')).toEqual([{ a: 1 }]);
    expect(parser.flush()).toEqual([]);
  });
});

describe('normalizeBaseUrl', () => {
  it('trims whitespace and trailing slashes', () => {
    expect(normalizeBaseUrl('  http://localhost:11434//  ')).toBe(BASE);
  });
});

describe('getVersion / listModels', () => {
  it('returns the Ollama version', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ version: '0.40.16' })));
    await expect(getVersion(BASE)).resolves.toBe('0.40.16');
    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/version`, expect.anything());
  });

  it('maps and sorts installed models', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          models: [
            { name: 'phi3:mini', size: 2, details: { parameter_size: '3.8B', family: 'phi3' } },
            { name: 'gemma3:latest', size: 3, details: { parameter_size: '4.3B', family: 'gemma3' } },
          ],
        }),
      ),
    );
    const models = await listModels(BASE);
    expect(models.map((m) => m.name)).toEqual(['gemma3:latest', 'phi3:mini']);
    expect(models[0]).toEqual({ name: 'gemma3:latest', size: 3, parameterSize: '4.3B', family: 'gemma3' });
  });

  it('reports unreachable when fetch fails (Ollama off or CORS blocked)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(listModels(BASE)).rejects.toMatchObject({ code: 'unreachable' });
  });

  it('reports unreachable when Ollama refuses the origin with 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));
    await expect(listModels(BASE)).rejects.toMatchObject({ code: 'unreachable', status: 403 });
  });

  it('rejects a server that is not Ollama', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hello: 'world' })));
    await expect(getVersion(BASE)).rejects.toMatchObject({ code: 'bad_response' });
  });

  it('times out when Ollama does not answer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
      ),
    );
    const promise = getVersion(BASE);
    const assertion = expect(promise).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });
});

describe('chatStream', () => {
  const messages = [{ role: 'user' as const, content: 'hi' }];

  it('yields text deltas and returns stats, even when lines are split', async () => {
    const lines = [
      '{"message":{"role":"assistant","content":"Hello"},"done":false}\n',
      '{"message":{"role":"assistant","content":" there"},"done":false}\n',
      '{"message":{"role":"assistant","content":""},"done":true,"eval_count":2,"eval_duration":1000,"load_duration":5}\n',
    ].join('');
    const pieces = [lines.slice(0, 17), lines.slice(17, 80), lines.slice(80)];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse(pieces)));

    const { text, result } = await collect(chatStream(BASE, messages, { model: 'gemma3:latest' }));
    expect(text).toBe('Hello there');
    expect(result).toEqual({ evalCount: 2, evalDuration: 1000, loadDuration: 5 });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(init!.body as string)).toMatchObject({
      model: 'gemma3:latest',
      stream: true,
      messages,
    });
  });

  it('reports model_not_found on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: "model 'nope' not found" }, 404)),
    );
    await expect(collect(chatStream(BASE, messages, { model: 'nope' }))).rejects.toMatchObject({
      code: 'model_not_found',
    });
  });

  it('surfaces an error sent mid-stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        streamResponse(['{"message":{"content":"Hi"}}\n', '{"error":"out of memory"}\n']),
      ),
    );
    await expect(collect(chatStream(BASE, messages, { model: 'm' }))).rejects.toMatchObject({
      code: 'bad_response',
      message: 'out of memory',
    });
  });

  it('reports aborted when the caller cancels', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        const body = new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(new TextEncoder().encode('{"message":{"content":"Hi"}}\n'));
            init.signal?.addEventListener('abort', () =>
              c.error(new DOMException('aborted', 'AbortError')),
            );
          },
        });
        return Promise.resolve(new Response(body));
      }),
    );

    const gen = chatStream(BASE, messages, { model: 'm', signal: controller.signal });
    expect((await gen.next()).value).toBe('Hi');
    const next = gen.next();
    controller.abort();
    await expect(next).rejects.toMatchObject({ code: 'aborted' });
  });
});

describe('describeAiError', () => {
  it('suggests OLLAMA_ORIGINS on a hosted site', () => {
    const d = describeAiError(new AiError('unreachable', 'x'), 'https://biblequest.causewaysoft.com');
    expect(d.hints.join(' ')).toContain('OLLAMA_ORIGINS "https://biblequest.causewaysoft.com"');
  });

  it('does not mention OLLAMA_ORIGINS on localhost', () => {
    const d = describeAiError(new AiError('unreachable', 'x'), 'http://localhost:5173');
    expect(d.hints.join(' ')).not.toContain('OLLAMA_ORIGINS');
  });
});
