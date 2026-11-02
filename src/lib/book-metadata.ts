export interface BookMeta {
  slug: string;
  name: string;
  testament: 'OT' | 'NT';
  chapterCount: number;
  /** File name in the TehShrike/world-english-bible repo (lowercased, no spaces). */
  sourceFile: string;
}

export const BOOKS: BookMeta[] = [
  // --- Old Testament ---
  { slug: 'genesis', name: 'Genesis', testament: 'OT', chapterCount: 50, sourceFile: 'genesis' },
  { slug: 'exodus', name: 'Exodus', testament: 'OT', chapterCount: 40, sourceFile: 'exodus' },
  { slug: 'leviticus', name: 'Leviticus', testament: 'OT', chapterCount: 27, sourceFile: 'leviticus' },
  { slug: 'numbers', name: 'Numbers', testament: 'OT', chapterCount: 36, sourceFile: 'numbers' },
  { slug: 'deuteronomy', name: 'Deuteronomy', testament: 'OT', chapterCount: 34, sourceFile: 'deuteronomy' },
  { slug: 'joshua', name: 'Joshua', testament: 'OT', chapterCount: 24, sourceFile: 'joshua' },
  { slug: 'judges', name: 'Judges', testament: 'OT', chapterCount: 21, sourceFile: 'judges' },
  { slug: 'ruth', name: 'Ruth', testament: 'OT', chapterCount: 4, sourceFile: 'ruth' },
  { slug: '1samuel', name: '1 Samuel', testament: 'OT', chapterCount: 31, sourceFile: '1samuel' },
  { slug: '2samuel', name: '2 Samuel', testament: 'OT', chapterCount: 24, sourceFile: '2samuel' },
  { slug: '1kings', name: '1 Kings', testament: 'OT', chapterCount: 22, sourceFile: '1kings' },
  { slug: '2kings', name: '2 Kings', testament: 'OT', chapterCount: 25, sourceFile: '2kings' },
  { slug: '1chronicles', name: '1 Chronicles', testament: 'OT', chapterCount: 29, sourceFile: '1chronicles' },
  { slug: '2chronicles', name: '2 Chronicles', testament: 'OT', chapterCount: 36, sourceFile: '2chronicles' },
  { slug: 'ezra', name: 'Ezra', testament: 'OT', chapterCount: 10, sourceFile: 'ezra' },
  { slug: 'nehemiah', name: 'Nehemiah', testament: 'OT', chapterCount: 13, sourceFile: 'nehemiah' },
  { slug: 'esther', name: 'Esther', testament: 'OT', chapterCount: 10, sourceFile: 'esther' },
  { slug: 'job', name: 'Job', testament: 'OT', chapterCount: 42, sourceFile: 'job' },
  { slug: 'psalms', name: 'Psalms', testament: 'OT', chapterCount: 150, sourceFile: 'psalms' },
  { slug: 'proverbs', name: 'Proverbs', testament: 'OT', chapterCount: 31, sourceFile: 'proverbs' },
  { slug: 'ecclesiastes', name: 'Ecclesiastes', testament: 'OT', chapterCount: 12, sourceFile: 'ecclesiastes' },
  { slug: 'songofsolomon', name: 'Song of Solomon', testament: 'OT', chapterCount: 8, sourceFile: 'songofsolomon' },
  { slug: 'isaiah', name: 'Isaiah', testament: 'OT', chapterCount: 66, sourceFile: 'isaiah' },
  { slug: 'jeremiah', name: 'Jeremiah', testament: 'OT', chapterCount: 52, sourceFile: 'jeremiah' },
  { slug: 'lamentations', name: 'Lamentations', testament: 'OT', chapterCount: 5, sourceFile: 'lamentations' },
  { slug: 'ezekiel', name: 'Ezekiel', testament: 'OT', chapterCount: 48, sourceFile: 'ezekiel' },
  { slug: 'daniel', name: 'Daniel', testament: 'OT', chapterCount: 12, sourceFile: 'daniel' },
  { slug: 'hosea', name: 'Hosea', testament: 'OT', chapterCount: 14, sourceFile: 'hosea' },
  { slug: 'joel', name: 'Joel', testament: 'OT', chapterCount: 3, sourceFile: 'joel' },
  { slug: 'amos', name: 'Amos', testament: 'OT', chapterCount: 9, sourceFile: 'amos' },
  { slug: 'obadiah', name: 'Obadiah', testament: 'OT', chapterCount: 1, sourceFile: 'obadiah' },
  { slug: 'jonah', name: 'Jonah', testament: 'OT', chapterCount: 4, sourceFile: 'jonah' },
  { slug: 'micah', name: 'Micah', testament: 'OT', chapterCount: 7, sourceFile: 'micah' },
  { slug: 'nahum', name: 'Nahum', testament: 'OT', chapterCount: 3, sourceFile: 'nahum' },
  { slug: 'habakkuk', name: 'Habakkuk', testament: 'OT', chapterCount: 3, sourceFile: 'habakkuk' },
  { slug: 'zephaniah', name: 'Zephaniah', testament: 'OT', chapterCount: 3, sourceFile: 'zephaniah' },
  { slug: 'haggai', name: 'Haggai', testament: 'OT', chapterCount: 2, sourceFile: 'haggai' },
  { slug: 'zechariah', name: 'Zechariah', testament: 'OT', chapterCount: 14, sourceFile: 'zechariah' },
  { slug: 'malachi', name: 'Malachi', testament: 'OT', chapterCount: 4, sourceFile: 'malachi' },
  // --- New Testament ---
  { slug: 'matthew', name: 'Matthew', testament: 'NT', chapterCount: 28, sourceFile: 'matthew' },
  { slug: 'mark', name: 'Mark', testament: 'NT', chapterCount: 16, sourceFile: 'mark' },
  { slug: 'luke', name: 'Luke', testament: 'NT', chapterCount: 24, sourceFile: 'luke' },
  { slug: 'john', name: 'John', testament: 'NT', chapterCount: 21, sourceFile: 'john' },
  { slug: 'acts', name: 'Acts', testament: 'NT', chapterCount: 28, sourceFile: 'acts' },
  { slug: 'romans', name: 'Romans', testament: 'NT', chapterCount: 16, sourceFile: 'romans' },
  { slug: '1corinthians', name: '1 Corinthians', testament: 'NT', chapterCount: 16, sourceFile: '1corinthians' },
  { slug: '2corinthians', name: '2 Corinthians', testament: 'NT', chapterCount: 13, sourceFile: '2corinthians' },
  { slug: 'galatians', name: 'Galatians', testament: 'NT', chapterCount: 6, sourceFile: 'galatians' },
  { slug: 'ephesians', name: 'Ephesians', testament: 'NT', chapterCount: 6, sourceFile: 'ephesians' },
  { slug: 'philippians', name: 'Philippians', testament: 'NT', chapterCount: 4, sourceFile: 'philippians' },
  { slug: 'colossians', name: 'Colossians', testament: 'NT', chapterCount: 4, sourceFile: 'colossians' },
  { slug: '1thessalonians', name: '1 Thessalonians', testament: 'NT', chapterCount: 5, sourceFile: '1thessalonians' },
  { slug: '2thessalonians', name: '2 Thessalonians', testament: 'NT', chapterCount: 3, sourceFile: '2thessalonians' },
  { slug: '1timothy', name: '1 Timothy', testament: 'NT', chapterCount: 6, sourceFile: '1timothy' },
  { slug: '2timothy', name: '2 Timothy', testament: 'NT', chapterCount: 4, sourceFile: '2timothy' },
  { slug: 'titus', name: 'Titus', testament: 'NT', chapterCount: 3, sourceFile: 'titus' },
  { slug: 'philemon', name: 'Philemon', testament: 'NT', chapterCount: 1, sourceFile: 'philemon' },
  { slug: 'hebrews', name: 'Hebrews', testament: 'NT', chapterCount: 13, sourceFile: 'hebrews' },
  { slug: 'james', name: 'James', testament: 'NT', chapterCount: 5, sourceFile: 'james' },
  { slug: '1peter', name: '1 Peter', testament: 'NT', chapterCount: 5, sourceFile: '1peter' },
  { slug: '2peter', name: '2 Peter', testament: 'NT', chapterCount: 3, sourceFile: '2peter' },
  { slug: '1john', name: '1 John', testament: 'NT', chapterCount: 5, sourceFile: '1john' },
  { slug: '2john', name: '2 John', testament: 'NT', chapterCount: 1, sourceFile: '2john' },
  { slug: '3john', name: '3 John', testament: 'NT', chapterCount: 1, sourceFile: '3john' },
  { slug: 'jude', name: 'Jude', testament: 'NT', chapterCount: 1, sourceFile: 'jude' },
  { slug: 'revelation', name: 'Revelation', testament: 'NT', chapterCount: 22, sourceFile: 'revelation' },
];

export function getBookBySlug(slug: string): BookMeta | undefined {
  return BOOKS.find((b) => b.slug === slug);
}

export function getOldTestamentBooks(): BookMeta[] {
  return BOOKS.filter((b) => b.testament === 'OT');
}

export function getNewTestamentBooks(): BookMeta[] {
  return BOOKS.filter((b) => b.testament === 'NT');
}
