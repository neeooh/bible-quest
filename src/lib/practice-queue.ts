import { getBookBySlug } from './book-metadata';
import { getPassageStage, type LearningStage } from './learning-stage';
import type { ExerciseResult, SavedVerse } from './types';

/** One passage the user has practised or saved, with where they are with it. */
export interface PracticeItem {
  key: string;
  book: string;
  chapter: number;
  start: number;
  end: number;
  reference: string;
  /** null = saved but never practised. */
  stage: LearningStage | null;
  stageLabel: string;
  dueForReview: boolean;
  nextReview: string | null;
  /** Last practice, or when it was saved if never practised. */
  lastActivity: number;
}

export interface StageCounts {
  learning: number;
  memorising: number;
  retention: number;
  notPractised: number;
  dueForReview: number;
}

/**
 * End verse of a stored reference like "Philippians 4:6–7", or `start` for a
 * single verse. Passages favourited from a Topic page are stored on their
 * first verse with the whole range in the reference.
 */
export function rangeEnd(reference: string, start: number): number {
  const m = reference.match(/:(\d+)\s*[–-]\s*(\d+)\s*$/);
  if (!m || Number(m[1]) !== start) return start;
  const end = Number(m[2]);
  return end > start ? end : start;
}

function formatRef(book: string, chapter: number, start: number, end: number): string {
  // A single psalm is "Psalm 23", not "Psalms 23".
  const name = book === 'psalms' ? 'Psalm' : (getBookBySlug(book)?.name ?? book);
  return end === start ? `${name} ${chapter}:${start}` : `${name} ${chapter}:${start}–${end}`;
}

/** Every practised or saved passage (minus ones the user removed), one entry each. */
export function getPracticeItems(
  history: ExerciseResult[],
  saved: SavedVerse[],
  hidden: string[] = [],
): PracticeItem[] {
  const items = new Map<string, PracticeItem>();

  for (const e of history) {
    const book = e.book ?? 'matthew';
    const key = `${book}:${e.chapterNumber}:${e.startVerse}-${e.endVerse}`;
    const existing = items.get(key);
    if (existing) {
      existing.lastActivity = Math.max(existing.lastActivity, e.timestamp);
      continue;
    }
    const ps = getPassageStage(history, book, e.chapterNumber, e.startVerse, e.endVerse);
    items.set(key, {
      key,
      book,
      chapter: e.chapterNumber,
      start: e.startVerse,
      end: e.endVerse,
      reference: formatRef(book, e.chapterNumber, e.startVerse, e.endVerse),
      stage: ps.stage,
      stageLabel: ps.label,
      dueForReview: ps.dueForReview,
      nextReview: ps.nextReview,
      lastActivity: e.timestamp,
    });
  }

  for (const sv of saved) {
    const end = rangeEnd(sv.reference, sv.verse);
    const key = `${sv.book}:${sv.chapter}:${sv.verse}-${end}`;
    if (items.has(key)) continue;
    items.set(key, {
      key,
      book: sv.book,
      chapter: sv.chapter,
      start: sv.verse,
      end,
      reference: sv.reference,
      stage: null,
      stageLabel: 'Not started',
      dueForReview: false,
      nextReview: null,
      lastActivity: sv.savedAt,
    });
  }

  return [...items.values()].filter((i) => !hidden.includes(i.key));
}

export function countStages(items: PracticeItem[]): StageCounts {
  const counts: StageCounts = { learning: 0, memorising: 0, retention: 0, notPractised: 0, dueForReview: 0 };
  for (const i of items) {
    if (i.stage === null) counts.notPractised++;
    else counts[i.stage]++;
    if (i.dueForReview) counts.dueForReview++;
  }
  return counts;
}

/** What to practise next: due reviews, then passages in progress, then saved ones not started. */
export function practiceQueue(items: PracticeItem[]): PracticeItem[] {
  const rank = (i: PracticeItem) => (i.dueForReview ? 0 : i.stage === null ? 2 : i.stage === 'retention' ? 3 : 1);
  return [...items]
    .filter((i) => rank(i) < 3)
    .sort((a, b) => rank(a) - rank(b) || b.lastActivity - a.lastActivity);
}
