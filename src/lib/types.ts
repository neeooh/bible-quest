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
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  accuracy: number;
  xpEarned: number;
  timestamp: number;
}

export interface UserProgress {
  totalXp: number;
  chaptersExplored: number[];
  passagesMemorized: string[]; // 'ch:startV-endV'
  exerciseHistory: ExerciseResult[];
  dailyStreak: number;
  lastPracticeDate: string; // YYYY-MM-DD
  bestAccuracy: number;
}

export interface DailyVerse {
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export interface ExerciseProps {
  verses: Verse[];
  chapter: number;
  startVerse: number;
  endVerse: number;
  onComplete: (accuracy: number) => void;
}
