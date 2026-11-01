import type { UserProgress, ExerciseResult } from './types';

const STORAGE_KEY = 'biblequest-progress';

/** XP awarded per exercise type. */
const XP_REWARDS: Record<ExerciseResult['type'], number> = {
  'missing-words': 20,
  progressive: 30,
  recitation: 50,
  voice: 40,
};

/** Bonus XP when accuracy exceeds 90 %. */
const HIGH_ACCURACY_BONUS = 10;
const HIGH_ACCURACY_THRESHOLD = 0.9;

/** XP required to reach a given level: 100 * level. */
function xpForLevel(level: number): number {
  return 100 * level;
}

/** Return the default (empty) progress object. */
export function getDefaultProgress(): UserProgress {
  return {
    totalXp: 0,
    chaptersExplored: [],
    passagesMemorized: [],
    exerciseHistory: [],
    dailyStreak: 0,
    lastPracticeDate: '',
    bestAccuracy: 0,
  };
}

/** Read progress from localStorage. Return defaults when nothing is stored. */
export function getProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    return JSON.parse(raw) as UserProgress;
  } catch {
    return getDefaultProgress();
  }
}

/** Persist the progress object to localStorage. */
export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** Add XP and save. Returns the updated progress. */
export function addXp(amount: number): UserProgress {
  const progress = getProgress();
  progress.totalXp += amount;
  saveProgress(progress);
  return progress;
}

/** Record a completed exercise, award XP, and save. */
export function recordExercise(result: ExerciseResult): UserProgress {
  const progress = getProgress();

  let xp = XP_REWARDS[result.type] ?? 0;
  if (result.accuracy > HIGH_ACCURACY_THRESHOLD) {
    xp += HIGH_ACCURACY_BONUS;
  }

  const enriched: ExerciseResult = { ...result, xpEarned: xp };
  progress.exerciseHistory.push(enriched);
  progress.totalXp += xp;

  if (result.accuracy > progress.bestAccuracy) {
    progress.bestAccuracy = result.accuracy;
  }

  // Update the practice date so the streak logic stays current.
  const today = new Date().toISOString().slice(0, 10);
  progress.lastPracticeDate = today;

  saveProgress(progress);
  return progress;
}

/** Mark a chapter as explored (no duplicates). */
export function markChapterExplored(chapter: number): UserProgress {
  const progress = getProgress();
  if (!progress.chaptersExplored.includes(chapter)) {
    progress.chaptersExplored.push(chapter);
  }
  saveProgress(progress);
  return progress;
}

/** Mark a passage as memorized using the key format "ch:startV-endV". */
export function markPassageMemorized(
  chapter: number,
  startVerse: number,
  endVerse: number,
): UserProgress {
  const progress = getProgress();
  const key = `${chapter}:${startVerse}-${endVerse}`;
  if (!progress.passagesMemorized.includes(key)) {
    progress.passagesMemorized.push(key);
  }
  saveProgress(progress);
  return progress;
}

/**
 * Update the daily streak.
 *
 * - If the last practice date is today, do nothing.
 * - If it is yesterday, increment the streak and set the date to today.
 * - Otherwise reset the streak to 0.
 */
export function updateStreak(): UserProgress {
  const progress = getProgress();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  if (progress.lastPracticeDate === todayStr) {
    // Already practiced today.
    saveProgress(progress);
    return progress;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (progress.lastPracticeDate === yesterdayStr) {
    progress.dailyStreak += 1;
  } else {
    // Streak broken (or first visit).
    progress.dailyStreak = 0;
  }

  saveProgress(progress);
  return progress;
}

/**
 * Derive the player level from total XP.
 *
 * Level thresholds grow linearly: level N requires 100 * N cumulative XP.
 * Returns the current level, XP within that level, and XP needed for the next.
 */
export function calculateLevel(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
} {
  let level = 1;
  let remaining = xp;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }

  return {
    level,
    currentXp: remaining,
    nextLevelXp: xpForLevel(level),
  };
}
