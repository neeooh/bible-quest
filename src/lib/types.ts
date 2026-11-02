export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  chapter: number;
  verses: Verse[];
}

export interface BibleData {
  book: string;
  translation: string;
  chapters: Chapter[];
}

export interface VerseRange {
  chapterIndex: number;
  startVerse: number;
  endVerse: number;
}

export interface ExerciseResult {
  type: 'missing-words' | 'progressive' | 'recitation' | 'voice';
  book: string;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  accuracy: number;
  xpEarned: number;
  timestamp: number;
  passageText?: string;
}

export interface UserProgress {
  totalXp: number;
  /** Format: "book:chapter" e.g. "genesis:1" */
  chaptersExplored: string[];
  passagesMemorized: string[];
  exerciseHistory: ExerciseResult[];
  dailyStreak: number;
  lastPracticeDate: string;
  bestAccuracy: number;
}

export interface DailyVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export interface SavedVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
  savedAt: number;
}

export interface ExerciseProps {
  verses: Verse[];
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  onComplete: (accuracy: number) => void;
}
