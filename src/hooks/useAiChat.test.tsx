import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAiSettings } from '../lib/ai/ai-settings';
import { useAiChat } from './useAiChat';

// Lets React know this is a test environment that supports act().
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Chat = ReturnType<typeof useAiChat>;

const SESSION_KEY = 'test-chat';
let root: Root;
let container: HTMLDivElement;
let chat: Chat;

function Harness({ sessionKey }: { sessionKey?: string }) {
  const result = useAiChat({
    buildMessages: (history) => [{ role: 'system', content: 'sys' }, ...history],
    sessionKey,
  });
  useEffect(() => {
    chat = result;
  });
  return null;
}

function mount(sessionKey?: string) {
  act(() => root.render(<Harness sessionKey={sessionKey} />));
}

function ndjson(...contents: string[]): Response {
  const lines = contents.map((c) => JSON.stringify({ message: { content: c }, done: false }) + '\n');
  lines.push(JSON.stringify({ message: { content: '' }, done: true }) + '\n');
  return new Response(lines.join(''));
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  saveAiSettings({ enabled: true, model: 'gemma3:latest' });
  container = document.createElement('div');
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
});

describe('useAiChat', () => {
  it('streams a reply and sends the built messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ndjson('You are ', 'not alone.'));
    vi.stubGlobal('fetch', fetchMock);
    mount();

    act(() => chat.send("  I'm feeling lonely  "));
    expect(chat.phase).toBe('waiting');
    await flush();

    expect(chat.phase).toBe('idle');
    expect(chat.turns.map((t) => [t.role, t.content])).toEqual([
      ['user', "I'm feeling lonely"],
      ['assistant', 'You are not alone.'],
    ]);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('gemma3:latest');
    expect(body.messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: "I'm feeling lonely" },
    ]);
  });

  it('ignores empty messages', () => {
    vi.stubGlobal('fetch', vi.fn());
    mount();
    act(() => chat.send('   '));
    expect(chat.turns).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('picks gemma3 and saves it when no model is selected', async () => {
    saveAiSettings({ model: '' });
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith('/api/tags')
          ? new Response(JSON.stringify({ models: [{ name: 'phi3:mini', size: 1 }, { name: 'gemma3:latest', size: 1 }] }))
          : ndjson('Hi'),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    mount();
    act(() => chat.send('hello'));
    await flush();
    const chatCall = fetchMock.mock.calls.find(([url]) => url.endsWith('/api/chat'))!;
    expect(JSON.parse((chatCall as unknown as [string, RequestInit])[1].body as string).model).toBe('gemma3:latest');
  });

  it('keeps the error on the reply and can retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ndjson('Second try')));
    mount();
    act(() => chat.send('hello'));
    await flush();
    expect(chat.turns[1].error?.code).toBe('unreachable');

    act(() => chat.retry());
    await flush();
    expect(chat.turns.map((t) => t.content)).toEqual(['hello', 'Second try']);
    expect(chat.turns[1].error).toBeUndefined();
  });

  it('stops a reply and keeps the partial text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        const body = new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(new TextEncoder().encode(JSON.stringify({ message: { content: 'Partial' } }) + '\n'));
            init.signal?.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')));
          },
        });
        return Promise.resolve(new Response(body));
      }),
    );
    mount();
    act(() => chat.send('hello'));
    await flush();
    expect(chat.phase).toBe('streaming');

    act(() => chat.stop());
    await flush();
    expect(chat.phase).toBe('idle');
    expect(chat.turns[1]).toMatchObject({ content: 'Partial', stopped: true });
  });

  it('keeps the conversation in sessionStorage and clears it on reset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ndjson('Saved reply')));
    mount(SESSION_KEY);
    act(() => chat.send('hello'));
    await flush();

    // A fresh mount (e.g. coming back from the Read page) restores it.
    act(() => root.unmount());
    root = createRoot(container);
    mount(SESSION_KEY);
    expect(chat.turns.map((t) => t.content)).toEqual(['hello', 'Saved reply']);

    act(() => chat.reset());
    await flush();
    expect(chat.turns).toEqual([]);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
