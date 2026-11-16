import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { collectVerseRefs, parseMessage, type InlineToken } from '../../lib/ai/message-format';
import { stripPetNameOpener } from '../../lib/ai/tone';
import {
  MAX_CARD_VERSES,
  readPath,
  refKey,
  type ResolvedPassage,
} from '../../lib/ai/scripture-guard';
import { useResolvedPassages } from '../../hooks/useResolvedPassages';
import type { UseSavedVersesReturn } from '../../hooks/useSavedVerses';
import VerseCarousel, { type CarouselCard } from './VerseCarousel';

interface AssistantMessageProps {
  content: string;
  /** True while the reply is still arriving. */
  streaming: boolean;
  saved: UseSavedVersesReturn;
  /**
   * Lets the page show a passage's card from outside (e.g. the passages panel).
   * Called with a function that shows the card for a passage key, or null on unmount.
   */
  registerShowCard?: (show: ((key: string) => boolean) | null) => void;
}

/**
 * Renders a mentor reply: light formatting, highlighted references that link
 * to the Read page, and a card with the real WEB text for each cited passage.
 */
export default function AssistantMessage({ content: raw, streaming, saved, registerShowCard }: AssistantMessageProps) {
  const content = useMemo(() => stripPetNameOpener(raw), [raw]);
  const blocks = useMemo(() => parseMessage(content), [content]);
  const refs = useMemo(() => collectVerseRefs(content, streaming), [content, streaming]);
  const resolved = useResolvedPassages(refs);

  const cards = useMemo(() => {
    const out: CarouselCard[] = [];
    for (const ref of refs) {
      const key = refKey(ref);
      const passage = resolved.get(key);
      if (passage && passage.verses.length <= MAX_CARD_VERSES) out.push({ key, passage });
    }
    return out;
  }, [refs, resolved]);
  const cardIndex = useMemo(() => new Map(cards.map((c, i) => [c.key, i])), [cards]);

  const [index, setIndex] = useState(0);
  const carouselRef = useRef<HTMLElement>(null);

  /** A reference in the text was clicked: show its card and bring it into view. */
  const showCard = (i: number) => {
    setIndex(i);
    const el = carouselRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    requestAnimationFrame(() => {
      el.querySelector('[data-current]')?.animate(
        [{ backgroundColor: 'rgba(214, 173, 96, 0.35)' }, { backgroundColor: 'transparent' }],
        { duration: 1200, easing: 'ease-out' },
      );
    });
  };

  useEffect(() => {
    if (!registerShowCard) return;
    registerShowCard((key) => {
      const i = cardIndex.get(key);
      if (i === undefined) return false;
      showCard(i);
      return true;
    });
    return () => registerShowCard(null);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-cream/90 text-base leading-relaxed break-words">
        {blocks.map((block, i) =>
          block.type === 'paragraph' ? (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline tokens={line} resolved={resolved} cardIndex={cardIndex} onShowCard={showCard} />
                </Fragment>
              ))}
            </p>
          ) : (
            <ListBlock key={i} ordered={block.ordered}>
              {block.items.map((item, j) => (
                <li key={j}>
                  <Inline tokens={item} resolved={resolved} cardIndex={cardIndex} onShowCard={showCard} />
                </li>
              ))}
            </ListBlock>
          ),
        )}
      </div>

      {cards.length > 0 && (
        <div className="space-y-4 pt-2">
          {/* Divider between the mentor's words and the Scripture passages */}
          <div className="flex items-center gap-3" role="separator" aria-label="Passages">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/30 to-gold-500/60" />
            <span className="flex items-center gap-1.5 text-gold-500 text-[11px] font-medium uppercase tracking-[0.2em]">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Passages
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-500/30 to-gold-500/60" />
          </div>
          <VerseCarousel
          ref={carouselRef}
          cards={cards}
          index={index}
          onIndexChange={setIndex}
          saved={saved}
          />
        </div>
      )}
    </div>
  );
}

function ListBlock({ ordered, children }: { ordered: boolean; children: React.ReactNode }) {
  return ordered ? (
    <ol className="list-decimal pl-6 space-y-2">{children}</ol>
  ) : (
    <ul className="list-disc pl-6 space-y-2 marker:text-gold-500">{children}</ul>
  );
}

function Inline({
  tokens,
  resolved,
  cardIndex,
  onShowCard,
}: {
  tokens: InlineToken[];
  resolved: Map<string, ResolvedPassage | null>;
  /** refKey → position of that passage's card in the carousel. */
  cardIndex: Map<string, number>;
  onShowCard: (index: number) => void;
}) {
  return (
    <>
      {tokens.map((t, i) => {
        const className = `${t.bold ? 'font-semibold text-cream' : ''} ${t.italic ? 'italic' : ''}`.trim();
        if (t.type === 'text') {
          return className ? (
            <span key={i} className={className}>
              {t.text}
            </span>
          ) : (
            <Fragment key={i}>{t.text}</Fragment>
          );
        }

        const { ref, raw } = t.match;
        const key = refKey(ref);

        // A reference with a card jumps to that card in the carousel below.
        const cardAt = cardIndex.get(key);
        if (cardAt !== undefined) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onShowCard(cardAt)}
              title="Show this passage below"
              className={`inline p-0 bg-transparent text-left text-gold-400 hover:text-gold-300 underline decoration-gold-500/40 underline-offset-2 cursor-pointer ${className}`}
            >
              {raw}
            </button>
          );
        }

        // A verse reference that turned out not to exist stays plain text.
        if (ref.startVerse !== undefined && resolved.get(key) === null) {
          return (
            <span key={i} className={className} title="Not found in the World English Bible">
              {raw}
            </span>
          );
        }
        // Whole chapters and very long ranges have no card: open the Read page.
        // A verse still being looked up is shown highlighted but not clickable yet.
        if (ref.startVerse !== undefined && !resolved.has(key)) {
          return (
            <span key={i} className={`text-gold-400 ${className}`}>
              {raw}
            </span>
          );
        }
        return (
          <Link
            key={i}
            to={readPath(ref)}
            className={`text-gold-400 hover:text-gold-300 underline decoration-gold-500/40 underline-offset-2 ${className}`}
          >
            {raw}
          </Link>
        );
      })}
    </>
  );
}
