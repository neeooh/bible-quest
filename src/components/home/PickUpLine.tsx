import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, Brain, Clock } from 'lucide-react';
import type { LastReadPosition } from '../../lib/last-read';
import type { PracticeItem } from '../../lib/practice-queue';
import { memorisePath } from '../../lib/verse-actions';

interface PickUpLineProps {
  practice: PracticeItem[];
  lastRead: LastReadPosition | null;
}

/**
 * One quiet "pick up where you left off" line under the Verse of the Day.
 * It shows the single most useful next step, or nothing at all — a new user
 * already has the hero's Memorise button as their invitation.
 */
export default function PickUpLine({ practice, lastRead }: PickUpLineProps) {
  const step = nextStep(practice, lastRead);
  if (!step) return null;

  return (
    <section aria-labelledby="pickup-label" className="mt-10 border-t border-cream/8 pt-6">
      <h2 id="pickup-label" className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-500">
        Pick up where you left off
      </h2>
      <Link
        to={step.to}
        className="group mt-3 flex items-center justify-between gap-4 rounded-xl py-1 text-cream transition-colors"
      >
        <span className="inline-flex min-w-0 items-center gap-2.5 text-[0.94rem]">
          <step.icon className="h-[17px] w-[17px] shrink-0 text-gold-500" aria-hidden="true" />
          <span className="min-w-0">{step.text}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gold-400 underline-offset-4 group-hover:underline">
          {step.action}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}

function nextStep(practice: PracticeItem[], lastRead: LastReadPosition | null) {
  const due = practice.filter((i) => i.dueForReview);
  if (due.length > 0) {
    return {
      icon: Clock,
      text: due.length === 1 ? `${due[0].reference} is due for review` : `${due.length} verses are due for review`,
      action: 'Review now',
      to: due.length === 1 ? memorisePath(due[0].book, due[0].chapter, due[0].start, due[0].end) : '/memorize',
    };
  }

  const inProgress = practice
    .filter((i) => i.stage === 'learning' || i.stage === 'memorising')
    .sort((a, b) => b.lastActivity - a.lastActivity)[0];
  if (inProgress) {
    return {
      icon: Brain,
      text: `Keep memorising ${inProgress.reference}`,
      action: 'Practise',
      to: memorisePath(inProgress.book, inProgress.chapter, inProgress.start, inProgress.end),
    };
  }

  if (lastRead) {
    return {
      icon: BookMarked,
      text: `Continue reading ${lastRead.bookName} ${lastRead.chapter}`,
      action: 'Read',
      to: `/read/${lastRead.book}/${lastRead.chapter}`,
    };
  }

  return null;
}
