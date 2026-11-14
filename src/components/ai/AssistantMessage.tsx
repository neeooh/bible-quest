import { Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collectVerseRefs, parseMessage, type InlineToken } from '../../lib/ai/message-format';
import {
  MAX_CARD_VERSES,
  readPath,
  refKey,
  type ResolvedPassage,
} from '../../lib/ai/scripture-guard';
import { useResolvedPassages } from '../../hooks/useResolvedPassages';
import type { UseSavedVersesReturn } from '../../hooks/useSavedVerses';
import VerseCard from './VerseCard';

interface AssistantMessageProps {
  content: string;
  /** True while the reply is still arriving. */
  streaming: boolean;
  saved: UseSavedVersesReturn;
}

/**
 * Renders a mentor reply: light formatting, highlighted references that link
 * to the Read page, and a card with the real WEB text for each cited passage.
 */
export default function AssistantMessage({ content, streaming, saved }: AssistantMessageProps) {
  const blocks = useMemo(() => parseMessage(content), [content]);
  const refs = useMemo(() => collectVerseRefs(content, streaming), [content, streaming]);
  const resolved = useResolvedPassages(refs);

  const cards = refs
    .map((ref) => resolved.get(refKey(ref)))
    .filter((p): p is ResolvedPassage => !!p && p.verses.length <= MAX_CARD_VERSES);

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-cream/90 text-base leading-relaxed break-words">
        {blocks.map((block, i) =>
          block.type === 'paragraph' ? (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline tokens={line} resolved={resolved} />
                </Fragment>
              ))}
            </p>
          ) : (
            <ListBlock key={i} ordered={block.ordered}>
              {block.items.map((item, j) => (
                <li key={j}>
                  <Inline tokens={item} resolved={resolved} />
                </li>
              ))}
            </ListBlock>
          ),
        )}
      </div>

      {cards.length > 0 && (
        <div className="space-y-3">
          {cards.map((passage) => (
            <VerseCard key={refKey(passage.ref)} passage={passage} saved={saved} />
          ))}
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
}: {
  tokens: InlineToken[];
  resolved: Map<string, ResolvedPassage | null>;
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
        // A verse reference that turned out not to exist stays plain text.
        if (ref.startVerse !== undefined && resolved.get(refKey(ref)) === null) {
          return (
            <span key={i} className={className} title="Not found in the World English Bible">
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
