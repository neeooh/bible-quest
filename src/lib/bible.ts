import type { BibleData, Chapter, Verse, DailyVerse } from './types';
import { getBookBySlug } from './book-metadata';

// ---------------------------------------------------------------------------
// Book cache — loaded on demand via dynamic import.
// ---------------------------------------------------------------------------

const bookCache = new Map<string, BibleData>();

const importMap: Record<string, () => Promise<{ default: BibleData }>> = {
  genesis: () => import('../data/books/genesis.json'),
  exodus: () => import('../data/books/exodus.json'),
  leviticus: () => import('../data/books/leviticus.json'),
  numbers: () => import('../data/books/numbers.json'),
  deuteronomy: () => import('../data/books/deuteronomy.json'),
  joshua: () => import('../data/books/joshua.json'),
  judges: () => import('../data/books/judges.json'),
  ruth: () => import('../data/books/ruth.json'),
  '1samuel': () => import('../data/books/1samuel.json'),
  '2samuel': () => import('../data/books/2samuel.json'),
  '1kings': () => import('../data/books/1kings.json'),
  '2kings': () => import('../data/books/2kings.json'),
  '1chronicles': () => import('../data/books/1chronicles.json'),
  '2chronicles': () => import('../data/books/2chronicles.json'),
  ezra: () => import('../data/books/ezra.json'),
  nehemiah: () => import('../data/books/nehemiah.json'),
  esther: () => import('../data/books/esther.json'),
  job: () => import('../data/books/job.json'),
  psalms: () => import('../data/books/psalms.json'),
  proverbs: () => import('../data/books/proverbs.json'),
  ecclesiastes: () => import('../data/books/ecclesiastes.json'),
  songofsolomon: () => import('../data/books/songofsolomon.json'),
  isaiah: () => import('../data/books/isaiah.json'),
  jeremiah: () => import('../data/books/jeremiah.json'),
  lamentations: () => import('../data/books/lamentations.json'),
  ezekiel: () => import('../data/books/ezekiel.json'),
  daniel: () => import('../data/books/daniel.json'),
  hosea: () => import('../data/books/hosea.json'),
  joel: () => import('../data/books/joel.json'),
  amos: () => import('../data/books/amos.json'),
  obadiah: () => import('../data/books/obadiah.json'),
  jonah: () => import('../data/books/jonah.json'),
  micah: () => import('../data/books/micah.json'),
  nahum: () => import('../data/books/nahum.json'),
  habakkuk: () => import('../data/books/habakkuk.json'),
  zephaniah: () => import('../data/books/zephaniah.json'),
  haggai: () => import('../data/books/haggai.json'),
  zechariah: () => import('../data/books/zechariah.json'),
  malachi: () => import('../data/books/malachi.json'),
  matthew: () => import('../data/books/matthew.json'),
  mark: () => import('../data/books/mark.json'),
  luke: () => import('../data/books/luke.json'),
  john: () => import('../data/books/john.json'),
  acts: () => import('../data/books/acts.json'),
  romans: () => import('../data/books/romans.json'),
  '1corinthians': () => import('../data/books/1corinthians.json'),
  '2corinthians': () => import('../data/books/2corinthians.json'),
  galatians: () => import('../data/books/galatians.json'),
  ephesians: () => import('../data/books/ephesians.json'),
  philippians: () => import('../data/books/philippians.json'),
  colossians: () => import('../data/books/colossians.json'),
  '1thessalonians': () => import('../data/books/1thessalonians.json'),
  '2thessalonians': () => import('../data/books/2thessalonians.json'),
  '1timothy': () => import('../data/books/1timothy.json'),
  '2timothy': () => import('../data/books/2timothy.json'),
  titus: () => import('../data/books/titus.json'),
  philemon: () => import('../data/books/philemon.json'),
  hebrews: () => import('../data/books/hebrews.json'),
  james: () => import('../data/books/james.json'),
  '1peter': () => import('../data/books/1peter.json'),
  '2peter': () => import('../data/books/2peter.json'),
  '1john': () => import('../data/books/1john.json'),
  '2john': () => import('../data/books/2john.json'),
  '3john': () => import('../data/books/3john.json'),
  jude: () => import('../data/books/jude.json'),
  revelation: () => import('../data/books/revelation.json'),
};

/**
 * Load a book's data. Returns from cache if already loaded.
 */
export async function loadBook(slug: string): Promise<BibleData> {
  const cached = bookCache.get(slug);
  if (cached) return cached;

  const loader = importMap[slug];
  if (!loader) throw new Error(`Unknown book: ${slug}`);

  const mod = await loader();
  const data = mod.default as BibleData;
  bookCache.set(slug, data);
  return data;
}

/**
 * Return a chapter from a loaded book. Returns undefined if the book
 * is not yet loaded or the chapter does not exist.
 */
export function getChapterSync(
  slug: string,
  num: number,
): Chapter | undefined {
  const book = bookCache.get(slug);
  if (!book) return undefined;
  return book.chapters.find((ch) => ch.chapter === num);
}

/**
 * Load a book and return a specific chapter.
 */
export async function getChapter(
  slug: string,
  num: number,
): Promise<Chapter | undefined> {
  const book = await loadBook(slug);
  return book.chapters.find((ch) => ch.chapter === num);
}

/**
 * Return verses within a chapter between start and end (inclusive).
 */
export async function getVerses(
  slug: string,
  chapter: number,
  start: number,
  end: number,
): Promise<Verse[]> {
  const ch = await getChapter(slug, chapter);
  if (!ch) return [];
  return ch.verses.filter((v) => v.verse >= start && v.verse <= end);
}

/**
 * Format a human-readable Scripture reference.
 * Examples: "Genesis 1:1", "Psalms 23:1-6"
 */
export function formatReference(
  bookName: string,
  chapter: number,
  startVerse: number,
  endVerse?: number,
): string {
  if (endVerse !== undefined && endVerse !== startVerse) {
    return `${bookName} ${chapter}:${startVerse}-${endVerse}`;
  }
  return `${bookName} ${chapter}:${startVerse}`;
}

// ---------------------------------------------------------------------------
// Daily verse — spans the full Bible.
// ---------------------------------------------------------------------------

const NOTABLE_VERSES: Array<{
  book: string;
  chapter: number;
  verse: number;
}> = [
  // Old Testament
  { book: 'genesis', chapter: 1, verse: 1 },
  { book: 'genesis', chapter: 1, verse: 27 },
  { book: 'genesis', chapter: 12, verse: 2 },
  { book: 'exodus', chapter: 14, verse: 14 },
  { book: 'deuteronomy', chapter: 6, verse: 5 },
  { book: 'deuteronomy', chapter: 31, verse: 6 },
  { book: 'joshua', chapter: 1, verse: 9 },
  { book: 'ruth', chapter: 1, verse: 16 },
  { book: '1samuel', chapter: 16, verse: 7 },
  { book: 'psalms', chapter: 1, verse: 1 },
  { book: 'psalms', chapter: 16, verse: 11 },
  { book: 'psalms', chapter: 19, verse: 1 },
  { book: 'psalms', chapter: 23, verse: 1 },
  { book: 'psalms', chapter: 27, verse: 1 },
  { book: 'psalms', chapter: 34, verse: 8 },
  { book: 'psalms', chapter: 37, verse: 4 },
  { book: 'psalms', chapter: 46, verse: 1 },
  { book: 'psalms', chapter: 46, verse: 10 },
  { book: 'psalms', chapter: 51, verse: 10 },
  { book: 'psalms', chapter: 91, verse: 1 },
  { book: 'psalms', chapter: 119, verse: 105 },
  { book: 'psalms', chapter: 139, verse: 14 },
  { book: 'proverbs', chapter: 3, verse: 5 },
  { book: 'proverbs', chapter: 3, verse: 6 },
  { book: 'proverbs', chapter: 4, verse: 23 },
  { book: 'proverbs', chapter: 16, verse: 3 },
  { book: 'proverbs', chapter: 22, verse: 6 },
  { book: 'ecclesiastes', chapter: 3, verse: 1 },
  { book: 'isaiah', chapter: 9, verse: 6 },
  { book: 'isaiah', chapter: 40, verse: 31 },
  { book: 'isaiah', chapter: 41, verse: 10 },
  { book: 'isaiah', chapter: 53, verse: 5 },
  { book: 'isaiah', chapter: 55, verse: 8 },
  { book: 'jeremiah', chapter: 29, verse: 11 },
  { book: 'lamentations', chapter: 3, verse: 22 },
  { book: 'micah', chapter: 6, verse: 8 },
  // New Testament
  { book: 'matthew', chapter: 5, verse: 14 },
  { book: 'matthew', chapter: 5, verse: 16 },
  { book: 'matthew', chapter: 6, verse: 33 },
  { book: 'matthew', chapter: 7, verse: 7 },
  { book: 'matthew', chapter: 11, verse: 28 },
  { book: 'matthew', chapter: 22, verse: 37 },
  { book: 'matthew', chapter: 28, verse: 19 },
  { book: 'mark', chapter: 10, verse: 27 },
  { book: 'luke', chapter: 6, verse: 31 },
  { book: 'john', chapter: 1, verse: 1 },
  { book: 'john', chapter: 3, verse: 16 },
  { book: 'john', chapter: 8, verse: 32 },
  { book: 'john', chapter: 14, verse: 6 },
  { book: 'john', chapter: 14, verse: 27 },
  { book: 'john', chapter: 15, verse: 13 },
  { book: 'acts', chapter: 1, verse: 8 },
  { book: 'romans', chapter: 5, verse: 8 },
  { book: 'romans', chapter: 8, verse: 28 },
  { book: 'romans', chapter: 8, verse: 38 },
  { book: 'romans', chapter: 12, verse: 2 },
  { book: '1corinthians', chapter: 13, verse: 4 },
  { book: '1corinthians', chapter: 13, verse: 13 },
  { book: '2corinthians', chapter: 5, verse: 17 },
  { book: 'galatians', chapter: 5, verse: 22 },
  { book: 'ephesians', chapter: 2, verse: 8 },
  { book: 'philippians', chapter: 4, verse: 6 },
  { book: 'philippians', chapter: 4, verse: 13 },
  { book: 'colossians', chapter: 3, verse: 23 },
  { book: 'hebrews', chapter: 11, verse: 1 },
  { book: 'hebrews', chapter: 12, verse: 1 },
  { book: 'james', chapter: 1, verse: 2 },
  { book: '1peter', chapter: 5, verse: 7 },
  { book: '1john', chapter: 4, verse: 19 },
  { book: 'revelation', chapter: 21, verse: 4 },
];

/**
 * Return a deterministic daily verse based on the current day of the year.
 * Async because it may need to load a book's data.
 */
export async function getDailyVerse(): Promise<DailyVerse> {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const index = dayOfYear % NOTABLE_VERSES.length;
  const ref = NOTABLE_VERSES[index];

  const bookMeta = getBookBySlug(ref.book);
  const bookName = bookMeta?.name ?? ref.book;

  const ch = await getChapter(ref.book, ref.chapter);
  const verse = ch?.verses.find((v) => v.verse === ref.verse);
  const text = verse?.text ?? '';
  const reference = formatReference(bookName, ref.chapter, ref.verse);

  return {
    book: ref.book,
    chapter: ref.chapter,
    verse: ref.verse,
    text,
    reference,
  };
}
