import { describe, expect, it } from 'vitest';
import { countStages, getPracticeItems, practiceQueue, rangeEnd } from './practice-queue';
import type { ExerciseResult, SavedVerse } from './types';

const day = 86_400_000;
const ex = (book: string, chapter: number, verse: number, daysAgo: number, accuracy = 0.9): ExerciseResult => ({
  type: 'missing-words',
  book,
  chapterNumber: chapter,
  startVerse: verse,
  endVerse: verse,
  accuracy,
  xpEarned: 10,
  timestamp: Date.now() - daysAgo * day,
});
const saved = (book: string, chapter: number, verse: number, reference: string): SavedVerse => ({
  book,
  chapter,
  verse,
  text: '…',
  reference,
  savedAt: Date.now(),
  favourite: true,
});

describe('rangeEnd', () => {
  it('reads the end verse of a range and ignores single verses', () => {
    expect(rangeEnd('Philippians 4:6–7', 6)).toBe(7);
    expect(rangeEnd('Matthew 6:25-27', 25)).toBe(27);
    expect(rangeEnd('Isaiah 41:10', 10)).toBe(10);
    expect(rangeEnd('Philippians 4:6–7', 5)).toBe(5);
  });
});

describe('getPracticeItems', () => {
  it('merges history and saved verses into one entry per passage', () => {
    const items = getPracticeItems(
      [ex('john', 3, 16, 2), ex('john', 3, 16, 1)],
      [saved('john', 3, 16, 'John 3:16'), saved('philippians', 4, 6, 'Philippians 4:6–7')],
    );
    expect(items.map((i) => i.key).sort()).toEqual(['john:3:16-16', 'philippians:4:6-7']);
    expect(items.find((i) => i.book === 'philippians')?.stage).toBeNull();
    expect(countStages(items).notPractised).toBe(1);
  });

  it('leaves out passages the user removed', () => {
    const items = getPracticeItems([ex('john', 3, 16, 1)], [], ['john:3:16-16']);
    expect(items).toEqual([]);
  });
});

describe('practiceQueue', () => {
  it('puts passages in progress before ones not started', () => {
    const items = getPracticeItems([ex('john', 3, 16, 1)], [saved('psalms', 23, 1, 'Psalm 23:1')]);
    expect(practiceQueue(items).map((i) => i.book)).toEqual(['john', 'psalms']);
  });
});
