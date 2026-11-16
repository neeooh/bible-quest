import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PassagesDrawer, { type DrawerPassage } from './PassagesDrawer';
import { useSavedVerses } from '../../hooks/useSavedVerses';
import { createCollection, getCollections } from '../../lib/collections';
import { getSavedVerses } from '../../lib/saved-verses';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const passages: DrawerPassage[] = [
  {
    key: 'psalms:34:18-18',
    turnId: 'a1',
    passage: {
      ref: { book: 'psalms', bookName: 'Psalms', chapter: 34, startVerse: 18, endVerse: 18 },
      verses: [{ verse: 18, text: 'Yahweh is near to those who have a broken heart.' }],
    },
  },
  {
    key: 'romans:8:38-39',
    turnId: 'a2',
    passage: {
      ref: { book: 'romans', bookName: 'Romans', chapter: 8, startVerse: 38, endVerse: 39 },
      verses: [
        { verse: 38, text: 'For I am persuaded…' },
        { verse: 39, text: 'nor height, nor depth…' },
      ],
    },
  },
];

let root: Root;
let container: HTMLDivElement;
const onShowInChat = vi.fn();

function Harness() {
  const saved = useSavedVerses();
  return (
    <MemoryRouter>
      <PassagesDrawer
        open
        onClose={() => {}}
        passages={passages}
        saved={saved}
        suggestedName="I'm feeling lonely"
        onShowInChat={onShowInChat}
      />
    </MemoryRouter>
  );
}

// The panel renders at the document root (portal), so look there.
const screen = () => document.body;
const button = (text: string) =>
  [...screen().querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(text))!;
const click = (el: Element) => act(() => (el as HTMLElement).click());

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('PassagesDrawer', () => {
  it('lists every passage, all ticked', () => {
    const boxes = screen().querySelectorAll<HTMLInputElement>('input[type=checkbox]');
    expect(boxes).toHaveLength(2);
    expect([...boxes].every((b) => b.checked)).toBe(true);
    expect(screen().textContent).toContain('2 of 2 selected');
  });

  it('saves only the ticked passages to a new collection and to My Verses', () => {
    click(screen().querySelector('input[aria-label="Include Psalm 34:18"]')!);
    expect(screen().textContent).toContain('1 of 2 selected');

    click(button('Save 1 to a collection'));
    const name = screen().querySelector<HTMLInputElement>('input[aria-label="Collection name"]')!;
    expect(name.value).toBe("I'm feeling lonely");
    click(button('Save 1 passage'));

    const [collection] = getCollections();
    expect(collection.name).toBe("I'm feeling lonely");
    expect(collection.passageKeys).toEqual(['romans:8:38-39']);
    expect(getSavedVerses().map((v) => `${v.book}:${v.verse}:${v.favourite}`)).toEqual([
      'romans:38:false',
      'romans:39:false',
    ]);
    expect(screen().textContent).toContain('Saved 1 passage to');
  });

  it('can add to an existing collection instead', () => {
    act(() => root.unmount());
    const { id } = createCollection('Comfort', '');
    root = createRoot(container);
    act(() => root.render(<Harness />));

    click(button('Save 2 to a collection'));
    click(screen().querySelector(`input[type=radio]:not(:checked)`)!);
    click(button('Save 2 passages'));

    const comfort = getCollections().find((c) => c.id === id)!;
    expect(comfort.passageKeys).toEqual(['psalms:34:18-18', 'romans:8:38-39']);
    expect(getCollections()).toHaveLength(1);
  });

  it('jumps to the passage in the chat', () => {
    click(button('Romans 8:38–39'));
    expect(onShowInChat).toHaveBeenCalledWith('a2', 'romans:8:38-39');
  });
});
