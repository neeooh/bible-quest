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
 * The passages cited in one reply, stacked on top of each other with
 * previous / next controls above. Each card keeps its natural height.
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

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Bible passages in this reply"
      onKeyDown={onKeyDown}
      className="space-y-3 scroll-mt-24 scroll-mb-48"
    >
      {/* Controls sit above the cards, so they stay put while card heights vary */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current === 0}
          aria-label="Previous verse"
          className="btn-outline !p-0 w-10 h-10 inline-flex items-center justify-center disabled:opacity-30 disabled:active:scale-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-cream/60 text-sm min-w-[8.5rem] text-center tabular-nums" aria-live="polite">
          Verse <span className="text-cream font-medium">{current + 1}</span> out of{' '}
          <span className="text-cream font-medium">{total}</span>
        </p>
        <button
          type="button"
          onClick={() => go(current + 1)}
          disabled={current === total - 1}
          aria-label="Next verse"
          className="btn-outline !p-0 w-10 h-10 inline-flex items-center justify-center disabled:opacity-30 disabled:active:scale-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className={`relative ${total > 2 ? 'pb-4' : total > 1 ? 'pb-2' : ''}`}>
        {/* Edges of the cards underneath, so it reads as a stack */}
        {total > 2 && (
          <div aria-hidden="true" className="absolute inset-x-6 top-4 bottom-0 rounded-xl border border-gold-500/10 bg-navy-700/20" />
        )}
        {total > 1 && (
          <div aria-hidden="true" className={`absolute inset-x-3 top-2 rounded-xl border border-gold-500/10 bg-navy-700/30 ${total > 2 ? 'bottom-2' : 'bottom-0'}`} />
        )}
        {/* Only the current card is rendered, at its natural height */}
        <div
          key={card.key}
          aria-roledescription="slide"
          aria-label={`Verse ${current + 1} out of ${total}`}
          data-current
          className="page-enter relative rounded-xl bg-navy-800"
        >
          <VerseCard passage={card.passage} saved={saved} />
        </div>
      </div>
    </section>
  );
});

export default VerseCarousel;
