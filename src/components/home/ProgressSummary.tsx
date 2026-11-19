import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import type { DailyVerse } from '../../lib/types';
import { memorisePath } from '../../lib/verse-actions';

export interface StageCounts {
  learning: number;
  memorising: number;
  retention: number;
  notPractised: number;
  dueForReview: number;
}

const STAGES = [
  { key: 'retention', label: 'Retention', filter: 'retention', swatch: 'bg-gold-500' },
  { key: 'memorising', label: 'Memorising', filter: 'memorising', swatch: 'bg-gold-500/60' },
  { key: 'learning', label: 'Learning', filter: 'learning', swatch: 'bg-gold-500/35' },
  { key: 'notPractised', label: 'Not started', filter: 'not-started', swatch: 'bg-cream/12' },
] as const;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Home page progress: one bar in shades of gold (most mature first), counts
 * that link to My Verses, and one clear next step. A brand-new user gets an
 * invitation instead of a row of zeros.
 */
export default function ProgressSummary({ counts, daily }: { counts: StageCounts; daily: DailyVerse | null }) {
  const total = counts.learning + counts.memorising + counts.retention + counts.notPractised;

  if (total === 0) {
    return (
      <section aria-labelledby="progress-label" className="border-t border-cream/8 pt-7">
        <h2 id="progress-label" className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-500">
          Your progress
        </h2>
        <p className="mt-3.5 font-scripture text-[1.19rem] leading-normal text-cream">
          Hide God’s word in your heart, one verse at a time.
        </p>
        <p className="mt-1.5 text-sm text-cream/60">
          Start with today’s verse, or save a few you love and we’ll track how well you know them.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {daily && (
            <Link
              to={memorisePath(daily.book, daily.chapter, daily.verse)}
              className="btn-gold inline-flex h-[46px] items-center gap-2 !rounded-xl !px-[22px] !py-0 text-[0.9rem] whitespace-nowrap"
            >
              Start with {daily.reference}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            to="/library"
            className="inline-flex h-[46px] items-center rounded-xl border border-gold-500/28 px-[18px] text-[0.88rem] font-medium text-cream transition-colors hover:border-gold-500/50 hover:bg-cream/5"
          >
            Find verses by topic
          </Link>
        </div>
      </section>
    );
  }

  const barLabel = STAGES.map((s) => `${counts[s.key]} ${s.label.toLowerCase()}`).join(', ');

  return (
    <section aria-labelledby="progress-label" className="border-t border-cream/8 pt-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="progress-label" className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-500">
          Your progress
        </h2>
        <Link to="/progress" className="text-[0.8rem] text-cream/60 transition-colors hover:text-cream">
          See details
        </Link>
      </div>

      <div role="img" aria-label={barLabel} className="mt-[18px] flex h-2 gap-[3px] overflow-hidden rounded-full">
        {STAGES.filter((s) => counts[s.key] > 0).map((s) => (
          <i key={s.key} className={`block h-full ${s.swatch}`} style={{ flexGrow: counts[s.key] }} />
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {STAGES.map((s) => (
          <li key={s.key}>
            <Link
              to={`/my-verses?stage=${s.filter}`}
              className="inline-flex items-center gap-[7px] text-[0.8rem] text-cream/60 transition-colors hover:text-cream"
            >
              <i aria-hidden="true" className={`h-2 w-2 rounded-full ${s.swatch}`} />
              <b className="font-semibold tabular-nums text-cream">{counts[s.key]}</b>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>

      <NextStep counts={counts} />
    </section>
  );
}

function NextStep({ counts }: { counts: StageCounts }) {
  let icon = <CheckCircle2 className="h-4 w-4 text-gold-500" aria-hidden="true" />;
  let message = 'You’re all caught up. Nice work.';
  let action: { label: string; to: string } | null = { label: 'Find a new verse', to: '/library' };

  if (counts.dueForReview > 0) {
    icon = <Clock className="h-4 w-4 text-gold-500" aria-hidden="true" />;
    message = `${plural(counts.dueForReview, 'verse is', 'verses are')} due for review today`;
    action = { label: 'Review now', to: '/my-verses?stage=due-for-review' };
  } else if (counts.notPractised > 0) {
    icon = <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />;
    message = `${plural(counts.notPractised, 'saved verse')} ready to start`;
    action = { label: 'Start learning', to: '/my-verses?stage=not-started' };
  }

  return (
    <div className="mt-[18px] flex flex-wrap items-center justify-between gap-3 border-t border-cream/8 pt-4">
      <p className="inline-flex items-center gap-2 text-sm text-cream">
        {icon}
        {message}
      </p>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-400 underline-offset-4 hover:underline"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
