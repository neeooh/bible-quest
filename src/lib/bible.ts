import type { BibleData, Chapter, Verse, DailyVerse } from './types';
import matthewRaw from '../data/matthew.json';

export const bibleData: BibleData = matthewRaw as BibleData;

/** Notable Matthew verse references used for daily verse rotation. */
const NOTABLE_VERSES: Array<{ chapter: number; verse: number }> = [
  { chapter: 1, verse: 21 },
  { chapter: 4, verse: 4 },
  { chapter: 4, verse: 19 },
  { chapter: 5, verse: 3 },
  { chapter: 5, verse: 9 },
  { chapter: 5, verse: 14 },
  { chapter: 5, verse: 16 },
  { chapter: 5, verse: 44 },
  { chapter: 6, verse: 9 },
  { chapter: 6, verse: 21 },
  { chapter: 6, verse: 33 },
  { chapter: 6, verse: 34 },
  { chapter: 7, verse: 7 },
  { chapter: 7, verse: 12 },
  { chapter: 7, verse: 24 },
  { chapter: 9, verse: 37 },
  { chapter: 10, verse: 28 },
  { chapter: 11, verse: 28 },
  { chapter: 11, verse: 29 },
  { chapter: 16, verse: 18 },
  { chapter: 16, verse: 26 },
  { chapter: 18, verse: 20 },
  { chapter: 19, verse: 26 },
  { chapter: 22, verse: 37 },
  { chapter: 22, verse: 39 },
  { chapter: 24, verse: 35 },
  { chapter: 25, verse: 21 },
  { chapter: 25, verse: 40 },
  { chapter: 28, verse: 19 },
  { chapter: 28, verse: 20 },
];

/**
 * Return the chapter object for the given chapter number.
 * Returns undefined when the chapter does not exist.
 */
export function getChapter(num: number): Chapter | undefined {
  return bibleData.chapters.find((ch) => ch.chapter === num);
}

/**
 * Return the verses within a chapter between start and end (inclusive).
 * Returns an empty array when the chapter or range is invalid.
 */
export function getVerses(
  chapter: number,
  start: number,
  end: number,
): Verse[] {
  const ch = getChapter(chapter);
  if (!ch) return [];
  return ch.verses.filter((v) => v.verse >= start && v.verse <= end);
}

/**
 * Return the text of a verse range as a single formatted string.
 * Each verse is prefixed with its number in superscript-style brackets.
 */
export function getVerseRange(
  chapter: number,
  start: number,
  end: number,
): string {
  const verses = getVerses(chapter, start, end);
  return verses.map((v) => `[${v.verse}] ${v.text}`).join(' ');
}

/**
 * Return a deterministic daily verse based on the current day of the year.
 * The same verse shows for everyone on the same calendar day.
 */
export function getDailyVerse(): DailyVerse {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const index = dayOfYear % NOTABLE_VERSES.length;
  const ref = NOTABLE_VERSES[index];

  const ch = getChapter(ref.chapter);
  const verse = ch?.verses.find((v) => v.verse === ref.verse);

  const text = verse?.text ?? '';
  const reference = formatReference(ref.chapter, ref.verse);

  return {
    chapter: ref.chapter,
    verse: ref.verse,
    text,
    reference,
  };
}

/**
 * Format a human-readable Scripture reference.
 * Examples: "Matthew 5:3", "Matthew 6:9-13"
 */
export function formatReference(
  chapter: number,
  startVerse: number,
  endVerse?: number,
): string {
  const book = bibleData.book;
  if (endVerse !== undefined && endVerse !== startVerse) {
    return `${book} ${chapter}:${startVerse}-${endVerse}`;
  }
  return `${book} ${chapter}:${startVerse}`;
}
