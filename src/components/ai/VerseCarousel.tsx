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
 * previous / next controls. All cards share one grid cell, so the carousel is
 * as tall as its tallest card and doesn't jump when switching.
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

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Bible passages in this reply"
      onKeyDown={onKeyDown}
      className="space-y-3 scroll-mt-24 scroll-mb-48"
    >
      <div className="relative">
        {/* Edges of the cards underneath, so it reads as a stack */}
        {total > 1 && (
          <>
            <div aria-hidden="true" className="absolute inset-x-3 -bottom-2 h-full rounded-xl border border-gold-500/10 bg-navy-700/30" />
            {total > 2 && (
              <div aria-hidden="true" className="absolute inset-x-6 -bottom-4 h-full rounded-xl border border-gold-500/10 bg-navy-700/20" />
            )}
          </>
        )}
        <div className="relative grid">
          {cards.map((card, i) => (
            <div
              key={card.key}
              aria-roledescription="slide"
              aria-label={`Verse ${i + 1} out of ${total}`}
              aria-hidden={i !== current}
              inert={i !== current}
              data-current={i === current || undefined}
              className={`[grid-area:1/1] flex flex-col transition-opacity duration-200 rounded-xl bg-navy-800 ${
                i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <VerseCard passage={card.passage} saved={saved} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={() => go(current - 1)}
            disabled={current === 0}
            aria-label="Previous verse"
            className="btn-outline !p-0 w-10 h-10 inline-flex items-center justify-center disabled:opacity-30 disabled:active:scale-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="text-cream/60 text-sm" aria-live="polite">
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
    </section>
  );
});

export default VerseCarousel;
