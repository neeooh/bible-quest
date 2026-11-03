import type { ExerciseResult } from './types';

export type LearningStage = 'learning' | 'memorising' | 'retention';

export interface PassageStage {
  stage: LearningStage;
  label: string;
  sessions: number;
  bestAccuracy: number;
  bestRecallAccuracy: number;
  nextReview: string | null;
  dueForReview: boolean;
}

const STORAGE_KEY = 'biblequest_review_schedule';
const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 90];
const RECALL_TYPES = new Set(['recitation', 'first-letters']);
const LEARNING_MIN_SESSIONS = 3;
const LEARNING_MIN_ACCURACY = 0.6;
const MEMORISING_RECALL_THRESHOLD = 0.85;

interface ReviewEntry {
  reviewCount: number;
  nextReview: string;
}

type ReviewSchedule = Record<string, ReviewEntry>;

function getReviewSchedule(): ReviewSchedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReviewSchedule;
  } catch {
    return {};
  }
}

function saveReviewSchedule(schedule: ReviewSchedule): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

function passageKey(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
): string {
  return `${book}:${chapter}:${startVerse}-${endVerse}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate the learning stage for a passage based on exercise history.
 *
 * Learning:   fewer than 3 sessions OR best accuracy below 60%.
 * Memorising: 3+ sessions, best accuracy >= 60%, but best recall accuracy below 85%.
 * Retention:  best recall accuracy (recitation or first-letters) >= 85%.
 */
export function getPassageStage(
  exercises: ExerciseResult[],
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
): PassageStage {
  const key = passageKey(book, chapter, startVerse, endVerse);
  const matching = exercises.filter(
    (e) =>
      (e.book ?? 'matthew') === book &&
      e.chapterNumber === chapter &&
      e.startVerse === startVerse &&
      e.endVerse === endVerse,
  );

  const sessions = matching.length;
  const bestAccuracy = matching.reduce(
    (max, e) => Math.max(max, e.accuracy),
    0,
  );
  const bestRecallAccuracy = matching
    .filter((e) => RECALL_TYPES.has(e.type))
    .reduce((max, e) => Math.max(max, e.accuracy), 0);

  const schedule = getReviewSchedule();
  const today = todayISO();

  let stage: LearningStage;

  if (
    sessions < LEARNING_MIN_SESSIONS ||
    bestAccuracy < LEARNING_MIN_ACCURACY
  ) {
    stage = 'learning';
  } else if (bestRecallAccuracy < MEMORISING_RECALL_THRESHOLD) {
    stage = 'memorising';
  } else {
    stage = 'retention';
    if (!schedule[key]) {
      schedule[key] = {
        reviewCount: 0,
        nextReview: addDays(today, REVIEW_INTERVALS[0]),
      };
      saveReviewSchedule(schedule);
    }
  }

  const nextReview = schedule[key]?.nextReview ?? null;
  const dueForReview = nextReview !== null && nextReview <= today;

  const labels: Record<LearningStage, string> = {
    learning: 'Learning',
    memorising: 'Memorising',
    retention: 'Retention',
  };

  return {
    stage,
    label: labels[stage],
    sessions,
    bestAccuracy,
    bestRecallAccuracy,
    nextReview,
    dueForReview,
  };
}

/**
 * Record a successful review and advance the spaced-repetition interval.
 */
export function recordReview(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
): void {
  const key = passageKey(book, chapter, startVerse, endVerse);
  const schedule = getReviewSchedule();
  const entry = schedule[key] ?? { reviewCount: 0, nextReview: todayISO() };
  const today = todayISO();

  entry.reviewCount += 1;
  const intervalIndex = Math.min(
    entry.reviewCount,
    REVIEW_INTERVALS.length - 1,
  );
  entry.nextReview = addDays(today, REVIEW_INTERVALS[intervalIndex]);

  schedule[key] = entry;
  saveReviewSchedule(schedule);
}

/**
 * Return exercise type keys available for a given stage.
 */
export function getAvailableExercises(stage: LearningStage): string[] {
  switch (stage) {
    case 'learning':
      return ['progressive', 'missing-words', 'word-order'];
    case 'memorising':
      return ['first-letters', 'progressive', 'recitation'];
    case 'retention':
      return ['recitation', 'first-letters'];
  }
}

/**
 * Format a review date for display.
 */
export function formatReviewDate(nextReview: string | null): string {
  if (!nextReview) return '';
  const today = todayISO();
  if (nextReview <= today) return 'Due today';
  const tomorrow = addDays(today, 1);
  if (nextReview === tomorrow) return 'Tomorrow';
  const diff = Math.round(
    (new Date(nextReview).getTime() - new Date(today).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return `In ${diff} days`;
}
