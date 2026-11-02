/**
 * Download the full World English Bible from TehShrike/world-english-bible
 * and transform into per-book JSON files matching the app's BibleData shape.
 *
 * Usage: node scripts/download-bible.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'books');

const BASE_URL =
  'https://raw.githubusercontent.com/TehShrike/world-english-bible/master/json';

/** All 66 books: [slug, display name, source file name in the repo]. */
const BOOKS = [
  ['genesis', 'Genesis', 'genesis'],
  ['exodus', 'Exodus', 'exodus'],
  ['leviticus', 'Leviticus', 'leviticus'],
  ['numbers', 'Numbers', 'numbers'],
  ['deuteronomy', 'Deuteronomy', 'deuteronomy'],
  ['joshua', 'Joshua', 'joshua'],
  ['judges', 'Judges', 'judges'],
  ['ruth', 'Ruth', 'ruth'],
  ['1samuel', '1 Samuel', '1samuel'],
  ['2samuel', '2 Samuel', '2samuel'],
  ['1kings', '1 Kings', '1kings'],
  ['2kings', '2 Kings', '2kings'],
  ['1chronicles', '1 Chronicles', '1chronicles'],
  ['2chronicles', '2 Chronicles', '2chronicles'],
  ['ezra', 'Ezra', 'ezra'],
  ['nehemiah', 'Nehemiah', 'nehemiah'],
  ['esther', 'Esther', 'esther'],
  ['job', 'Job', 'job'],
  ['psalms', 'Psalms', 'psalms'],
  ['proverbs', 'Proverbs', 'proverbs'],
  ['ecclesiastes', 'Ecclesiastes', 'ecclesiastes'],
  ['songofsolomon', 'Song of Solomon', 'songofsolomon'],
  ['isaiah', 'Isaiah', 'isaiah'],
  ['jeremiah', 'Jeremiah', 'jeremiah'],
  ['lamentations', 'Lamentations', 'lamentations'],
  ['ezekiel', 'Ezekiel', 'ezekiel'],
  ['daniel', 'Daniel', 'daniel'],
  ['hosea', 'Hosea', 'hosea'],
  ['joel', 'Joel', 'joel'],
  ['amos', 'Amos', 'amos'],
  ['obadiah', 'Obadiah', 'obadiah'],
  ['jonah', 'Jonah', 'jonah'],
  ['micah', 'Micah', 'micah'],
  ['nahum', 'Nahum', 'nahum'],
  ['habakkuk', 'Habakkuk', 'habakkuk'],
  ['zephaniah', 'Zephaniah', 'zephaniah'],
  ['haggai', 'Haggai', 'haggai'],
  ['zechariah', 'Zechariah', 'zechariah'],
  ['malachi', 'Malachi', 'malachi'],
  ['matthew', 'Matthew', 'matthew'],
  ['mark', 'Mark', 'mark'],
  ['luke', 'Luke', 'luke'],
  ['john', 'John', 'john'],
  ['acts', 'Acts', 'acts'],
  ['romans', 'Romans', 'romans'],
  ['1corinthians', '1 Corinthians', '1corinthians'],
  ['2corinthians', '2 Corinthians', '2corinthians'],
  ['galatians', 'Galatians', 'galatians'],
  ['ephesians', 'Ephesians', 'ephesians'],
  ['philippians', 'Philippians', 'philippians'],
  ['colossians', 'Colossians', 'colossians'],
  ['1thessalonians', '1 Thessalonians', '1thessalonians'],
  ['2thessalonians', '2 Thessalonians', '2thessalonians'],
  ['1timothy', '1 Timothy', '1timothy'],
  ['2timothy', '2 Timothy', '2timothy'],
  ['titus', 'Titus', 'titus'],
  ['philemon', 'Philemon', 'philemon'],
  ['hebrews', 'Hebrews', 'hebrews'],
  ['james', 'James', 'james'],
  ['1peter', '1 Peter', '1peter'],
  ['2peter', '2 Peter', '2peter'],
  ['1john', '1 John', '1john'],
  ['2john', '2 John', '2john'],
  ['3john', '3 John', '3john'],
  ['jude', 'Jude', 'jude'],
  ['revelation', 'Revelation', 'revelation'],
];

/**
 * Transform the TehShrike flat-array format into our BibleData shape.
 *
 * Source entries have { type, chapterNumber?, verseNumber?, value? }.
 * We keep entries where type is "paragraph text" or "line text".
 * Entries with the same chapterNumber + verseNumber get their text concatenated.
 */
function transform(raw, bookName) {
  const verseEntries = raw.filter(
    (e) => e.type === 'paragraph text' || e.type === 'line text',
  );

  // Group by chapter, then by verse, concatenating sections.
  const chapterMap = new Map();

  for (const entry of verseEntries) {
    const ch = entry.chapterNumber;
    const vn = entry.verseNumber;
    const text = (entry.value || '').trim();
    if (!ch || !vn || !text) continue;

    if (!chapterMap.has(ch)) chapterMap.set(ch, new Map());
    const verseMap = chapterMap.get(ch);

    if (verseMap.has(vn)) {
      verseMap.set(vn, verseMap.get(vn) + ' ' + text);
    } else {
      verseMap.set(vn, text);
    }
  }

  // Build the final structure sorted by chapter and verse number.
  const chapters = [];
  const sortedChapters = Array.from(chapterMap.keys()).sort((a, b) => a - b);

  for (const chNum of sortedChapters) {
    const verseMap = chapterMap.get(chNum);
    const sortedVerses = Array.from(verseMap.keys()).sort((a, b) => a - b);
    const verses = sortedVerses.map((vn) => ({
      verse: vn,
      text: verseMap.get(vn),
    }));
    chapters.push({ chapter: chNum, verses });
  }

  return {
    book: bookName,
    translation: 'WEB',
    chapters,
  };
}

async function downloadBook(slug, name, sourceFile) {
  const url = `${BASE_URL}/${sourceFile}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const raw = await res.json();
  const data = transform(raw, name);
  const outPath = join(OUT_DIR, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(data));
  const totalVerses = data.chapters.reduce((s, c) => s + c.verses.length, 0);
  return { slug, chapters: data.chapters.length, verses: totalVerses };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Downloading ${BOOKS.length} books...\n`);

  // Process in batches of 8 to avoid overwhelming the network.
  const BATCH = 8;
  const results = [];

  for (let i = 0; i < BOOKS.length; i += BATCH) {
    const batch = BOOKS.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(([slug, name, src]) => downloadBook(slug, name, src)),
    );
    for (const r of batchResults) {
      results.push(r);
      console.log(
        `  ✓ ${r.slug.padEnd(18)} ${String(r.chapters).padStart(3)} chapters, ${String(r.verses).padStart(5)} verses`,
      );
    }
  }

  const totalChapters = results.reduce((s, r) => s + r.chapters, 0);
  const totalVerses = results.reduce((s, r) => s + r.verses, 0);
  console.log(
    `\nDone. ${results.length} books, ${totalChapters} chapters, ${totalVerses} verses.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
