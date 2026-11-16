import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import VerseCarousel, { type CarouselCard } from './VerseCarousel';
import { useSavedVerses } from '../../hooks/useSavedVerses';
import { getSavedVerses } from '../../lib/saved-verses';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const cards: CarouselCard[] = [
  {
    key: 'psalms:34:18-18',
    passage: {
      ref: { book: 'psalms', bookName: 'Psalms', chapter: 34, startVerse: 18, endVerse: 18 },
      verses: [{ verse: 18, text: 'Yahweh is near to those who have a broken heart.' }],
    },
  },
  {
    key: 'romans:8:38-39',
    passage: {
      ref: { book: 'romans', bookName: 'Romans', chapter: 8, startVerse: 38, endVerse: 39 },
      verses: [
        { verse: 38, text: 'For I am persuaded that neither death, nor life,' },
        { verse: 39, text: 'nor height, nor depth, nor any other created thing,' },
      ],
    },
  },
];

let root: Root;
let container: HTMLDivElement;

function Harness({ list = cards }: { list?: CarouselCard[] }) {
  const saved = useSavedVerses();
  const [index, setIndex] = useState(0);
  return (
    <MemoryRouter>
      <VerseCarousel cards={list} index={index} onIndexChange={setIndex} saved={saved} />
    </MemoryRouter>
  );
}

const q = (sel: string) => container.querySelector(sel) as HTMLElement | null;
const byLabel = (label: string) => q(`[aria-label="${label}"]`)!;
const click = (el: Element) => act(() => (el as HTMLElement).click());

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('VerseCarousel', () => {
  it('shows one passage with the pager in the card header', () => {
    act(() => root.render(<Harness />));
    expect(q('article h3')?.textContent).toContain('Psalm 34:18');
    expect(q('article header [aria-label="Previous verse"]')).not.toBeNull();
    expect(q('[aria-live="polite"]')?.textContent).toContain('1');
    expect((byLabel('Previous verse') as HTMLButtonElement).disabled).toBe(true);
  });

  it('moves between passages and keeps focus on the pager', () => {
    act(() => root.render(<Harness />));
    const next = byLabel('Next verse');
    next.focus();
    click(next);
    expect(q('article h3')?.textContent).toContain('Romans 8:38–39');
    // Multi-verse passages get verse numbers.
    expect([...container.querySelectorAll('blockquote sup')].map((s) => s.textContent)).toEqual(['38', '39']);
    expect(document.activeElement).toBe(byLabel('Next verse'));
    expect((byLabel('Next verse') as HTMLButtonElement).disabled).toBe(true);
  });

  it('has no pager for a single passage', () => {
    act(() => root.render(<Harness list={[cards[0]]} />));
    expect(q('[aria-label="Previous verse"]')).toBeNull();
  });

  it('offers Practise and favourites the whole passage', () => {
    act(() => root.render(<Harness list={[cards[1]]} />));
    const practise = [...container.querySelectorAll('a')].find((a) => a.textContent?.includes('Practise'));
    expect(practise?.getAttribute('href')).toBe('/memorize?book=romans&chapter=8&start=38&end=39');

    click(byLabel('Add Romans 8:38–39 to favourites'));
    expect(getSavedVerses().map((v) => [v.verse, v.favourite])).toEqual([
      [38, true],
      [39, true],
    ]);
    expect(q('[aria-label="Remove Romans 8:38–39 from favourites"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('opens the ⋯ menu and closes it with Escape', () => {
    act(() => root.render(<Harness list={[cards[0]]} />));
    click(byLabel('More actions for Psalm 34:18'));
    expect(q('[role="menu"]')).not.toBeNull();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(q('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(byLabel('More actions for Psalm 34:18'));
  });
});
