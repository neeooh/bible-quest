const STORAGE_KEY = 'biblequest_last_read';

export interface LastReadPosition {
  book: string;
  bookName: string;
  chapter: number;
  timestamp: number;
}

export function getLastRead(): LastReadPosition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastReadPosition;
  } catch {
    return null;
  }
}

export function saveLastRead(
  book: string,
  bookName: string,
  chapter: number,
): void {
  const position: LastReadPosition = {
    book,
    bookName,
    chapter,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
}
