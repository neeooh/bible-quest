import type { SavedVerse } from './types';

const STORAGE_KEY = 'biblequest_saved_verses_v2';

export function getSavedVerses(): SavedVerse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedVerse[];
  } catch {
    return [];
  }
}

function persist(verses: SavedVerse[]): SavedVerse[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verses));
  return verses;
}

export function addSavedVerse(
  verse: Omit<SavedVerse, 'savedAt'>,
): SavedVerse[] {
  const current = getSavedVerses();
  const exists = current.some(
    (v) =>
      v.book === verse.book &&
      v.chapter === verse.chapter &&
      v.verse === verse.verse,
  );
  if (exists) return current;
  return persist([...current, { ...verse, savedAt: Date.now() }]);
}

export function addSavedVerses(
  verses: Omit<SavedVerse, 'savedAt'>[],
): SavedVerse[] {
  const current = getSavedVerses();
  const toAdd: SavedVerse[] = [];

  for (const verse of verses) {
    const alreadyStored = current.some(
      (v) =>
        v.book === verse.book &&
        v.chapter === verse.chapter &&
        v.verse === verse.verse,
    );
    const alreadyQueued = toAdd.some(
      (v) =>
        v.book === verse.book &&
        v.chapter === verse.chapter &&
        v.verse === verse.verse,
    );
    if (!alreadyStored && !alreadyQueued) {
      toAdd.push({ ...verse, savedAt: Date.now() });
    }
  }

  if (toAdd.length === 0) return current;
  return persist([...current, ...toAdd]);
}

export function removeSavedVerse(
  book: string,
  chapter: number,
  verse: number,
): SavedVerse[] {
  const current = getSavedVerses();
  return persist(
    current.filter(
      (v) =>
        !(v.book === book && v.chapter === chapter && v.verse === verse),
    ),
  );
}
