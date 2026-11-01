import { useCallback, useEffect, useState } from 'react';
import type { ExerciseResult, UserProgress } from '../lib/types';
import * as progressLib from '../lib/progress';

export interface UseProgressReturn {
  progress: UserProgress;
  addXp: (amount: number) => void;
  recordExercise: (result: ExerciseResult) => void;
  markChapterExplored: (chapter: number) => void;
  markPassageMemorized: (
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

  // Update the streak on mount so the UI reflects the current state.
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

  const markChapterExplored = useCallback((chapter: number) => {
    const updated = progressLib.markChapterExplored(chapter);
    setProgress(updated);
  }, []);

  const markPassageMemorized = useCallback(
    (chapter: number, startVerse: number, endVerse: number) => {
      const updated = progressLib.markPassageMemorized(
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
