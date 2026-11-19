import { useEffect, useState } from 'react';
import { getVerses } from '../lib/bible';
import type { Verse } from '../lib/types';

export interface PassageRange {
  /** Any stable key the caller uses to look the result up. */
  key: string;
  book: string;
  chapter: number;
  start: number;
  end: number;
}

/**
 * Loads the full World English Bible text for each passage range.
 *
 * Verse cards always show these verses, never stored copies: stored text can
 * be a shortened preview (topics) or cut at 200 characters (practice
 * history). Pass a memoised `ranges` array.
 */
export function usePassageVerses(ranges: PassageRange[]): Map<string, Verse[]> {
  const [verses, setVerses] = useState<Map<string, Verse[]>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      ranges.map(async (r) => [r.key, await getVerses(r.book, r.chapter, r.start, r.end)] as const),
    )
      .then((loaded) => {
        if (!cancelled) setVerses(new Map(loaded.filter(([, v]) => v.length > 0)));
      })
      .catch(() => {
        // Book data failed to load; cards fall back to the stored text.
      });
    return () => {
      cancelled = true;
    };
  }, [ranges]);

  return verses;
}

/** Plain passage text, verses joined by spaces. */
export function joinVerses(verses: Verse[] | undefined): string | undefined {
  return verses?.map((v) => v.text).join(' ');
}
