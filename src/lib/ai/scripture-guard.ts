import { BOOKS, getBookBySlug } from '../book-metadata';
import { getChapter } from '../bible';
import type { Verse } from '../types';

/**
 * Finds Bible references in AI-generated text and checks them against the
 * bundled World English Bible, so only real passages are ever linked or shown.
 */

export interface ScriptureRef {
  /** Book slug, e.g. "1corinthians". */
  book: string;
  bookName: string;
  chapter: number;
  /** Absent for whole-chapter references like "Psalm 23". */
  startVerse?: number;
  endVerse?: number;
}

export interface RefMatch {
  /** Position of the reference in the source text. */
  index: number;
  /** The reference exactly as written, e.g. "1 Cor. 13:4–7". */
  raw: string;
  ref: ScriptureRef;
}

// ---------------------------------------------------------------------------
// Book name aliases
// ---------------------------------------------------------------------------

/** Extra names and abbreviations beyond each book's display name. */
const EXTRA_ALIASES: Record<string, string[]> = {
  genesis: ['Gen', 'Gn'],
  exodus: ['Exod', 'Ex'],
  leviticus: ['Lev'],
  numbers: ['Num'],
  deuteronomy: ['Deut', 'Dt'],
  joshua: ['Josh'],
  judges: ['Judg'],
  '1samuel': ['Sam'],
  '2samuel': ['Sam'],
  '1kings': ['Kgs'],
  '2kings': ['Kgs'],
  '1chronicles': ['Chron', 'Chr'],
  '2chronicles': ['Chron', 'Chr'],
  nehemiah: ['Neh'],
  esther: ['Esth'],
  psalms: ['Psalm', 'Psa', 'Ps'],
  proverbs: ['Prov', 'Prv'],
  ecclesiastes: ['Eccles', 'Eccl', 'Ecc'],
  songofsolomon: ['Song of Songs', 'Song'],
  isaiah: ['Isa'],
  jeremiah: ['Jer'],
  lamentations: ['Lam'],
  ezekiel: ['Ezek'],
  daniel: ['Dan'],
  hosea: ['Hos'],
  obadiah: ['Obad'],
  micah: ['Mic'],
  nahum: ['Nah'],
  habakkuk: ['Hab'],
  zephaniah: ['Zeph'],
  haggai: ['Hag'],
  zechariah: ['Zech'],
  malachi: ['Mal'],
  matthew: ['Matt', 'Mt'],
  mark: ['Mk'],
  luke: ['Lk'],
  john: ['Jn'],
  romans: ['Rom'],
  '1corinthians': ['Cor'],
  '2corinthians': ['Cor'],
  galatians: ['Gal'],
  ephesians: ['Eph'],
  philippians: ['Phil'],
  colossians: ['Col'],
  '1thessalonians': ['Thess'],
  '2thessalonians': ['Thess'],
  '1timothy': ['Tim'],
  '2timothy': ['Tim'],
  philemon: ['Philem'],
  hebrews: ['Heb'],
  james: ['Jas'],
  '1peter': ['Pet'],
  '2peter': ['Pet'],
  '1john': ['Jn'],
  '2john': ['Jn'],
  '3john': ['Jn'],
  revelation: ['Rev', 'Revelations'],
};

const NUMBER_PREFIXES: Record<string, string[]> = {
  '1': ['1', 'I', 'First', '1st'],
  '2': ['2', 'II', 'Second', '2nd'],
  '3': ['3', 'III', 'Third', '3rd'],
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Map of every accepted alias (lower-cased, single-spaced) to a book slug. */
const ALIAS_TO_SLUG = new Map<string, string>();

for (const book of BOOKS) {
  const numbered = /^([123]) (.+)$/.exec(book.name);
  const baseNames = [numbered ? numbered[2] : book.name, ...(EXTRA_ALIASES[book.slug] ?? [])];
  for (const base of baseNames) {
    const variants = numbered
      ? NUMBER_PREFIXES[numbered[1]].flatMap((p) => [`${p} ${base}`, `${p}${base}`])
      : [base];
    for (const v of variants) ALIAS_TO_SLUG.set(v.toLowerCase(), book.slug);
  }
}

// Longest first so "1 John" wins over "John", "Song of Songs" over "Song".
const ALIAS_PATTERN = [...ALIAS_TO_SLUG.keys()]
  .sort((a, b) => b.length - a.length)
  .map((alias) => escapeRegex(alias).replace(/ /g, '\\s+'))
  .join('|');

/**
 * <book>[.] <chapter>[:<verse>[–<endVerse> | –<endChapter>:<endVerse>]]
 * The book must start with a capital letter or digit to avoid matching
 * ordinary words ("mark 5 people").
 */
const REFERENCE_RE = new RegExp(
  `(?<![\\p{L}\\d])(${ALIAS_PATTERN})\\.?\\s+(\\d{1,3})(?:(?:\\s*:\\s*|\\.)(\\d{1,3})(?:\\s*[-–—]\\s*(?:(\\d{1,3})\\s*:\\s*)?(\\d{1,3}))?)?(?!\\d)(?!:\\d)`,
  'giu',
);

function startsUpperOrDigit(s: string): boolean {
  return /^[\p{Lu}\d]/u.test(s);
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Finds every reference in `text` whose book exists and whose chapter is in
 * range. Verse numbers are checked later by `resolvePassage`, which needs the
 * book's text.
 */
export function parseScriptureReferences(text: string): RefMatch[] {
  const matches: RefMatch[] = [];
  for (const m of text.matchAll(REFERENCE_RE)) {
    const [raw, bookText, chapterText, verseText, endChapterText, endVerseText] = m;
    if (!startsUpperOrDigit(bookText)) continue;

    const slug = ALIAS_TO_SLUG.get(bookText.toLowerCase().replace(/\s+/g, ' '));
    const meta = slug ? getBookBySlug(slug) : undefined;
    if (!meta) continue;

    const chapter = Number(chapterText);
    if (chapter < 1 || chapter > meta.chapterCount) continue;

    const ref: ScriptureRef = { book: meta.slug, bookName: meta.name, chapter };

    if (verseText) {
      const startVerse = Number(verseText);
      if (startVerse < 1) continue;
      const endChapter = endChapterText ? Number(endChapterText) : chapter;
      if (endChapter !== chapter) {
        // Cross-chapter range ("John 3:16–4:2"): link the chapter only.
        matches.push({ index: m.index ?? 0, raw, ref });
        continue;
      }
      const endVerse = endVerseText ? Number(endVerseText) : startVerse;
      if (endVerse < startVerse) continue;
      ref.startVerse = startVerse;
      ref.endVerse = endVerse;
    }

    matches.push({ index: m.index ?? 0, raw, ref });
  }
  return matches;
}

/** Stable key for de-duplicating references, e.g. "john:3:16-16". */
export function refKey(ref: ScriptureRef): string {
  return ref.startVerse === undefined
    ? `${ref.book}:${ref.chapter}`
    : `${ref.book}:${ref.chapter}:${ref.startVerse}-${ref.endVerse ?? ref.startVerse}`;
}

/** Canonical display form, e.g. "Romans 8:38–39". */
export function formatScriptureRef(ref: ScriptureRef): string {
  if (ref.startVerse === undefined) return `${ref.bookName} ${ref.chapter}`;
  const end = ref.endVerse ?? ref.startVerse;
  return end === ref.startVerse
    ? `${ref.bookName} ${ref.chapter}:${ref.startVerse}`
    : `${ref.bookName} ${ref.chapter}:${ref.startVerse}–${end}`;
}

/** Link to the passage on the Read page. */
export function readPath(ref: ScriptureRef): string {
  const base = `/read/${ref.book}/${ref.chapter}`;
  if (ref.startVerse === undefined) return base;
  return `${base}?verse=${ref.startVerse}&end=${ref.endVerse ?? ref.startVerse}`;
}

// ---------------------------------------------------------------------------
// Resolving against the bundled Bible
// ---------------------------------------------------------------------------

export interface ResolvedPassage {
  /** The reference, with an end verse clamped to the chapter's last verse. */
  ref: ScriptureRef;
  verses: Verse[];
}

/** Very long ranges are shown as links, not cards. */
export const MAX_CARD_VERSES = 12;

/**
 * Loads the real WEB text for a verse reference. Returns null when the
 * starting verse doesn't exist (an invented reference) or the reference
 * has no verses.
 */
export async function resolvePassage(ref: ScriptureRef): Promise<ResolvedPassage | null> {
  if (ref.startVerse === undefined) return null;
  const chapter = await getChapter(ref.book, ref.chapter);
  if (!chapter) return null;

  const last = chapter.verses[chapter.verses.length - 1]?.verse ?? 0;
  if (ref.startVerse > last) return null;
  const end = Math.min(ref.endVerse ?? ref.startVerse, last);
  const verses = chapter.verses.filter((v) => v.verse >= ref.startVerse! && v.verse <= end);
  if (verses.length === 0) return null;

  return { ref: { ...ref, endVerse: end }, verses };
}
