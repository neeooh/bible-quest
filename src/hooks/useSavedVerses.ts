import { useCallback, useState } from 'react';
import type { SavedVerse } from '../lib/types';
import * as savedVersesLib from '../lib/saved-verses';

export interface UseSavedVersesReturn {
  savedVerses: SavedVerse[];
  addVerse: (verse: Omit<SavedVerse, 'savedAt'>) => void;
  addVerses: (verses: Omit<SavedVerse, 'savedAt'>[]) => void;
  removeVerse: (chapter: number, verse: number) => void;
  isSaved: (chapter: number, verse: number) => boolean;
}

export function useSavedVerses(): UseSavedVersesReturn {
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>(
    savedVersesLib.getSavedVerses,
  );

  const addVerse = useCallback((verse: Omit<SavedVerse, 'savedAt'>) => {
    const updated = savedVersesLib.addSavedVerse(verse);
    setSavedVerses(updated);
  }, []);

  const addVerses = useCallback((verses: Omit<SavedVerse, 'savedAt'>[]) => {
    const updated = savedVersesLib.addSavedVerses(verses);
    setSavedVerses(updated);
  }, []);

  const removeVerse = useCallback((chapter: number, verse: number) => {
    const updated = savedVersesLib.removeSavedVerse(chapter, verse);
    setSavedVerses(updated);
  }, []);

  const isSaved = useCallback(
    (chapter: number, verse: number) =>
      savedVerses.some((v) => v.chapter === chapter && v.verse === verse),
    [savedVerses],
  );

  return { savedVerses, addVerse, addVerses, removeVerse, isSaved };
}
