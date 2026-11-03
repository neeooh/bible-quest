import type { UserProgress, ExerciseResult } from './types';

const STORAGE_KEY = 'biblequest-progress-v2';

const XP_REWARDS: Record<ExerciseResult['type'], number> = {
  'missing-words': 20,
  'first-letters': 35,
  'word-order': 25,
  progressive: 30,
  recitation: 50,
};

const HIGH_ACCURACY_BONUS = 10;
const HIGH_ACCURACY_THRESHOLD = 0.9;

function xpForLevel(level: number): number {
  return 100 * level;
}

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

export function getProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    return JSON.parse(raw) as UserProgress;
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function addXp(amount: number): UserProgress {
  const progress = getProgress();
  progress.totalXp += amount;
  saveProgress(progress);
  return progress;
}

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

  const today = new Date().toISOString().slice(0, 10);
  progress.lastPracticeDate = today;

  saveProgress(progress);
  return progress;
}

/** Mark a chapter as explored. Format: "book:chapter". */
export function markChapterExplored(
  book: string,
  chapter: number,
): UserProgress {
  const progress = getProgress();
  const key = `${book}:${chapter}`;
  if (!progress.chaptersExplored.includes(key)) {
    progress.chaptersExplored.push(key);
  }
  saveProgress(progress);
  return progress;
}

export function markPassageMemorized(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
): UserProgress {
  const progress = getProgress();
  const key = `${book}:${chapter}:${startVerse}-${endVerse}`;
  if (!progress.passagesMemorized.includes(key)) {
    progress.passagesMemorized.push(key);
  }
  saveProgress(progress);
  return progress;
}

export function updateStreak(): UserProgress {
  const progress = getProgress();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  if (progress.lastPracticeDate === todayStr) {
    saveProgress(progress);
    return progress;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (progress.lastPracticeDate === yesterdayStr) {
    progress.dailyStreak += 1;
  } else {
    progress.dailyStreak = 0;
  }

  saveProgress(progress);
  return progress;
}

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
