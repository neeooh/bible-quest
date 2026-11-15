import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatHistoryDrawer from './ChatHistoryDrawer';
import type { SavedChat } from '../../lib/ai/chat-history';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const chat = (id: string, title: string, questions = 1): SavedChat => ({
  id,
  title,
  createdAt: 1,
  updatedAt: Date.now(),
  turns: Array.from({ length: questions }, (_, i) => [
    { id: `${id}-u${i}`, role: 'user' as const, content: `Q${i}` },
    { id: `${id}-a${i}`, role: 'assistant' as const, content: `A${i}` },
  ]).flat(),
});

let root: Root;
let container: HTMLDivElement;
const handlers = { onOpenChat: vi.fn(), onDeleteChat: vi.fn(), onClearAll: vi.fn(), onClose: vi.fn() };

function render(chats: SavedChat[], currentId = 'none') {
  act(() => root.render(<ChatHistoryDrawer open chats={chats} currentId={currentId} {...handlers} />));
}

// The panel renders at the document root (portal).
const body = () => document.body;
const button = (text: string) =>
  [...body().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
const click = (el: Element) => act(() => (el as HTMLElement).click());

beforeEach(() => {
  Object.values(handlers).forEach((h) => h.mockReset());
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('ChatHistoryDrawer', () => {
  it('shows an empty state', () => {
    render([]);
    expect(body().textContent).toContain('No saved chats yet');
  });

  it('lists chats with question counts and marks the open one', () => {
    render([chat('a', 'Feeling lonely', 2), chat('b', 'Anxious')], 'a');
    expect(body().textContent).toContain('Feeling lonely');
    expect(body().textContent).toContain('2 questions');
    expect(body().textContent).toContain('1 question');
    expect(body().querySelector('[aria-current=true]')?.textContent).toContain('Feeling lonely');
  });

  it('opens a chat', () => {
    const chats = [chat('a', 'Feeling lonely')];
    render(chats);
    click([...body().querySelectorAll('button')].find((b) => b.textContent?.includes('Feeling lonely'))!);
    expect(handlers.onOpenChat).toHaveBeenCalledWith(chats[0]);
  });

  it('asks before deleting one chat', () => {
    render([chat('a', 'Feeling lonely')]);
    click(body().querySelector('button[aria-label="Delete “Feeling lonely”"]')!);
    expect(handlers.onDeleteChat).not.toHaveBeenCalled();
    expect(body().textContent).toContain('Delete this chat?');
    click(button('Delete'));
    expect(handlers.onDeleteChat).toHaveBeenCalledWith('a');
  });

  it('asks before clearing all chats, and can cancel', () => {
    render([chat('a', 'A'), chat('b', 'B')]);
    click(button('Clear all'));
    expect(body().textContent).toContain('Delete all 2 saved chats?');
    click(button('Cancel'));
    expect(handlers.onClearAll).not.toHaveBeenCalled();
    click(button('Clear all'));
    click(button('Delete all'));
    expect(handlers.onClearAll).toHaveBeenCalledTimes(1);
  });
});
