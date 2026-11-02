import { useCallback, useEffect, useState } from 'react';
import type { ExerciseResult, UserProgress } from '../lib/types';
import * as progressLib from '../lib/progress';

export interface UseProgressReturn {
  progress: UserProgress;
  addXp: (amount: number) => void;
  recordExercise: (result: ExerciseResult) => void;
  markChapterExplored: (book: string, chapter: number) => void;
  markPassageMemorized: (
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
  ) => void;
  updateStreak: () => void;
  level: { level: number; currentXp: number; nextLevelXp: number };
}

export function useProgress(): UseProgressReturn {
  const [progress, setProgress] = useState<UserProgress>(
    progressLib.getProgress,
  );

  useEffect(() => {
    const updated = progressLib.updateStreak();
    setProgress(updated);
  }, []);

  const addXp = useCallback((amount: number) => {
    const updated = progressLib.addXp(amount);
    setProgress(updated);
  }, []);

  const recordExercise = useCallback((result: ExerciseResult) => {
    const updated = progressLib.recordExercise(result);
    setProgress(updated);
  }, []);

  const markChapterExplored = useCallback(
    (book: string, chapter: number) => {
      const updated = progressLib.markChapterExplored(book, chapter);
      setProgress(updated);
    },
    [],
  );

  const markPassageMemorized = useCallback(
    (book: string, chapter: number, startVerse: number, endVerse: number) => {
      const updated = progressLib.markPassageMemorized(
        book,
        chapter,
        startVerse,
        endVerse,
      );
      setProgress(updated);
    },
    [],
  );

  const handleUpdateStreak = useCallback(() => {
    const updated = progressLib.updateStreak();
    setProgress(updated);
  }, []);

  const level = progressLib.calculateLevel(progress.totalXp);

  return {
    progress,
    addXp,
    recordExercise,
    markChapterExplored,
    markPassageMemorized,
    updateStreak: handleUpdateStreak,
    level,
  };
}
