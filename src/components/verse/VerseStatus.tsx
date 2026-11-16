import { Clock } from 'lucide-react';
import { formatReviewDate, type LearningStage } from '../../lib/learning-stage';

const STAGES: LearningStage[] = ['learning', 'memorising', 'retention'];
const STAGE_LABEL: Record<LearningStage, string> = {
  learning: 'Learning',
  memorising: 'Memorising',
  retention: 'Retention',
};

/** Three-step progress bar for the card footer: "Memorising · 2 of 3". */
export function StageProgress({ stage, started }: { stage: LearningStage; started: boolean }) {
  const step = started ? STAGES.indexOf(stage) + 1 : 0;
  return (
    <div className="flex items-center gap-2.5 text-[0.78rem] text-cream/60">
      <span className="flex gap-[3px]" aria-hidden="true">
        {STAGES.map((s, i) => (
          <i key={s} className={`h-1 w-[18px] rounded-sm ${i < step ? 'bg-gold-400' : 'bg-cream/10'}`} />
        ))}
      </span>
      {started ? (
        <span>
          <span className="font-medium text-cream">{STAGE_LABEL[stage]}</span> · {step} of 3
        </span>
      ) : (
        <span>Ready to learn</span>
      )}
    </div>
  );
}

/** Header-right review status: a soft gold pill when due, muted text otherwise. */
export function ReviewStatus({ nextReview, due }: { nextReview: string | null; due: boolean }) {
  if (due) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gold-500/12 px-2.5 py-1 text-[0.78rem] font-medium text-gold-400">
        <Clock className="h-[13px] w-[13px]" aria-hidden="true" />
        Review due today
      </span>
    );
  }
  if (!nextReview) return null;
  return (
    <span className="whitespace-nowrap text-[0.78rem] text-cream/60">
      Next review {formatReviewDate(nextReview).toLowerCase()}
    </span>
  );
}

