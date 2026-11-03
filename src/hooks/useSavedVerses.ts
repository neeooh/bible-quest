import { useCallback, useState } from 'react';
import type { SavedVerse } from '../lib/types';
import * as savedVersesLib from '../lib/saved-verses';

export interface UseSavedVersesReturn {
  savedVerses: SavedVerse[];
  addVerse: (verse: Omit<SavedVerse, 'savedAt'>) => void;
  addVerses: (verses: Omit<SavedVerse, 'savedAt'>[]) => void;
  removeVerse: (book: string, chapter: number, verse: number) => void;
  setFavourite: (book: string, chapter: number, verse: number, favourite: boolean) => void;
  isSaved: (book: string, chapter: number, verse: number) => boolean;
  isFavourite: (book: string, chapter: number, verse: number) => boolean;
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

  const removeVerse = useCallback(
    (book: string, chapter: number, verse: number) => {
      const updated = savedVersesLib.removeSavedVerse(book, chapter, verse);
      setSavedVerses(updated);
    },
    [],
  );

  const setFavourite = useCallback(
    (book: string, chapter: number, verse: number, favourite: boolean) => {
      const updated = savedVersesLib.setVerseFavourite(book, chapter, verse, favourite);
      setSavedVerses(updated);
    },
    [],
  );

  const isSaved = useCallback(
    (book: string, chapter: number, verse: number) =>
      savedVerses.some(
        (v) =>
          v.book === book && v.chapter === chapter && v.verse === verse,
      ),
    [savedVerses],
  );

  const isFavourite = useCallback(
    (book: string, chapter: number, verse: number) =>
      savedVerses.some(
        (v) =>
          v.book === book &&
          v.chapter === chapter &&
          v.verse === verse &&
          v.favourite !== false,
      ),
    [savedVerses],
  );

  return { savedVerses, addVerse, addVerses, removeVerse, setFavourite, isSaved, isFavourite };
}
