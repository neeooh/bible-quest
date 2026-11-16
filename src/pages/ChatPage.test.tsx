import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPage from './ChatPage';
import { saveAiSettings } from '../lib/ai/ai-settings';
import { getSavedChats, saveChat } from '../lib/ai/chat-history';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Browser APIs jsdom doesn't provide.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});

/** A fake local Ollama: version, one model, and a short streamed reply. */
function fakeOllama(reply = 'You are not alone. Psalm 34:18 is for you.') {
  return vi.fn((url: string) => {
    if (url.endsWith('/api/version')) return Promise.resolve(new Response(JSON.stringify({ version: '0.40.16' })));
    if (url.endsWith('/api/tags')) {
      return Promise.resolve(new Response(JSON.stringify({ models: [{ name: 'gemma3:latest', size: 1 }] })));
    }
    const body = [
      JSON.stringify({ message: { content: reply }, done: false }),
      JSON.stringify({ message: { content: '' }, done: true }),
    ].join('\n');
    return Promise.resolve(new Response(body + '\n'));
  });
}

let root: Root;
let container: HTMLDivElement;
let location = '';
let navigateTo: (to: string) => void = () => {};

function Probe() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    location = pathname;
    navigateTo = (to) => navigate(to);
  });
  return null;
}

async function renderAt(path: string) {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Probe />
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/read/*" element={<p>Read page</p>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  await flush();
}

async function flush() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

const text = () => document.body.textContent ?? '';
const userMessages = () =>
  [...document.querySelectorAll('p.whitespace-pre-wrap')].map((p) => p.textContent);

async function typeAndSend(message: string) {
  const box = document.querySelector<HTMLTextAreaElement>('#chat-input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(box, message);
    box.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  await flush();
}

const lonely = [
  { id: 'u1', role: 'user' as const, content: "I'm feeling lonely" },
  { id: 'a1', role: 'assistant' as const, content: 'Psalm 34:18 reminds you God is near.' },
];

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  saveAiSettings({ enabled: true, model: 'gemma3:latest', saveHistory: true });
  vi.stubGlobal('fetch', fakeOllama());
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('ChatPage addresses (history on)', () => {
  it('/chat is a new chat, listing recent chats', async () => {
    saveChat('c1', lonely);
    await renderAt('/chat');
    expect(userMessages()).toEqual([]);
    expect(text()).toContain('Share what’s on your heart');
    expect(text()).toContain("I'm feeling lonely"); // in Recent chats
  });

  it('/chat/<id> opens that saved chat', async () => {
    saveChat('c1', lonely);
    await renderAt('/chat/c1');
    expect(userMessages()).toEqual(["I'm feeling lonely"]);
    expect(location).toBe('/chat/c1');
  });

  it('an unknown or deleted chat goes back to a new chat', async () => {
    await renderAt('/chat/missing');
    expect(location).toBe('/chat');
    expect(userMessages()).toEqual([]);
  });

  it('after the first reply, the chat is saved and gets its own address', async () => {
    await renderAt('/chat');
    await typeAndSend('I feel far from God');

    const [saved] = getSavedChats();
    expect(saved.title).toBe('I feel far from God');
    expect(location).toBe(`/chat/${saved.id}`);
    expect(userMessages()).toEqual(['I feel far from God']);
  });

  it('coming back to a chat address (e.g. Back from the Read page) restores it', async () => {
    saveChat('c1', lonely);
    await renderAt('/chat/c1');
    await act(async () => navigateTo('/read/psalms/34'));
    expect(text()).toContain('Read page');
    await act(async () => navigateTo('/chat/c1'));
    await flush();
    expect(userMessages()).toEqual(["I'm feeling lonely"]);
  });

  it('going to /chat from an open chat (the nav link) starts a new chat', async () => {
    saveChat('c1', lonely);
    await renderAt('/chat/c1');
    await act(async () => navigateTo('/chat'));
    await flush();
    expect(userMessages()).toEqual([]);
    expect(location).toBe('/chat');
  });
});

describe('ChatPage with history off', () => {
  beforeEach(() => saveAiSettings({ saveHistory: false }));

  it('/chat restores the conversation from this tab', async () => {
    sessionStorage.setItem('biblequest-ai-chat', JSON.stringify(lonely));
    await renderAt('/chat');
    expect(userMessages()).toEqual(["I'm feeling lonely"]);
  });

  it('chat addresses fall back to /chat and nothing is saved', async () => {
    await renderAt('/chat/c1');
    expect(location).toBe('/chat');
    await typeAndSend('Hello');
    expect(getSavedChats()).toEqual([]);
    expect(location).toBe('/chat');
  });
});
