import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatReviewDate } from '../../lib/learning-stage';
import type { PracticeItem } from '../../lib/practice-queue';
import { memorisePath, practiseLabel } from '../../lib/verse-actions';

const MAX_ROWS = 6;

/**
 * Memorise landing: what to practise next — due reviews first, then
 * passages in progress, then saved verses not started yet.
 */
export default function PracticeList({ queue }: { queue: PracticeItem[] }) {
  if (queue.length === 0) return null;
  const rows = queue.slice(0, MAX_ROWS);

  return (
    <section
      aria-labelledby="practice-label"
      className="rounded-2xl border border-gold-500/10 bg-navy-800 px-[18px] pt-5 pb-2 sm:px-7"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="practice-label" className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-500">
          Your practice
        </h2>
        {queue.length > MAX_ROWS && (
          <Link to="/my-verses" className="text-[0.8rem] text-cream/60 transition-colors hover:text-cream">
            See all {queue.length}
          </Link>
        )}
      </div>

      <ul className="mt-2 divide-y divide-cream/8">
        {rows.map((item) => {
          const action = practiseLabel(item.stage === null ? 0 : 1, item.dueForReview);
          return (
            <li key={item.key}>
              <Link
                to={memorisePath(item.book, item.chapter, item.start, item.end)}
                className="group flex items-center justify-between gap-4 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-serif text-[1.06rem] font-semibold text-gold-400">
                    {item.reference}
                  </span>
                  <span className="mt-0.5 block text-[0.8rem] text-cream/60">{statusText(item)}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-cream transition-colors group-hover:text-gold-400">
                  {action}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function statusText(item: PracticeItem): string {
  if (item.dueForReview) return `${item.stageLabel} · review due today`;
  if (item.stage === null) return 'Saved · not started yet';
  const next = item.nextReview ? ` · next review ${formatReviewDate(item.nextReview).toLowerCase()}` : '';
  return `${item.stageLabel}${next}`;
}
