import { forwardRef, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ResolvedPassage } from '../../lib/ai/scripture-guard';
import type { UseSavedVersesReturn } from '../../hooks/useSavedVerses';
import VerseCard from './VerseCard';

export interface CarouselCard {
  /** refKey of the reference as written in the reply. */
  key: string;
  passage: ResolvedPassage;
}

interface VerseCarouselProps {
  cards: CarouselCard[];
  index: number;
  onIndexChange: (index: number) => void;
  saved: UseSavedVersesReturn;
}

/**
 * The passages cited in one reply, one card at a time, with previous / next
 * controls in the card's header. Each card keeps its natural height.
 */
const VerseCarousel = forwardRef<HTMLElement, VerseCarouselProps>(function VerseCarousel(
  { cards, index, onIndexChange, saved },
  ref,
) {
  const total = cards.length;
  const current = Math.min(index, total - 1);
  const go = (i: number) => onIndexChange(Math.max(0, Math.min(total - 1, i)));

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, input, textarea')) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(current - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(current + 1);
    }
  };

  const card = cards[current];

  const pager =
    total > 1 ? (
      <div className="flex items-center gap-0.5 -mr-2" role="group" aria-label="Choose a passage">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current === 0}
          aria-label="Previous verse"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cream/60 transition-colors hover:bg-cream/6 hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
        <p className="min-w-[2.75rem] text-center text-[0.78rem] tabular-nums text-cream/60" aria-live="polite">
          <span className="sr-only">Verse </span>
          <span className="font-medium text-cream">{current + 1}</span>
          <span aria-hidden="true"> / </span>
          <span className="sr-only"> out of </span>
          {total}
        </p>
        <button
          type="button"
          onClick={() => go(current + 1)}
          disabled={current === total - 1}
          aria-label="Next verse"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cream/60 transition-colors hover:bg-cream/6 hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    ) : undefined;

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Bible passages in this reply"
      onKeyDown={onKeyDown}
      className="scroll-mt-32 scroll-mb-32"
    >
      {/* Only the current card is rendered, at its natural height. The pager sits in
          its header, so the card is not re-keyed per slide: that would remount the
          pager buttons and drop keyboard focus. */}
      <div
        aria-roledescription="slide"
        aria-label={`Verse ${current + 1} out of ${total}`}
        data-current
      >
        <VerseCard passage={card.passage} saved={saved} aside={pager} />
      </div>
    </section>
  );
});

export default VerseCarousel;
