import { describe, expect, it } from 'vitest';
import {
  formatScriptureRef,
  parseScriptureReferences,
  readPath,
  refKey,
  resolvePassage,
} from './scripture-guard';

const parse = (text: string) => parseScriptureReferences(text).map((m) => m.ref);
const keys = (text: string) => parseScriptureReferences(text).map((m) => refKey(m.ref));

describe('parseScriptureReferences', () => {
  it('finds simple references', () => {
    expect(keys('Remember John 3:16 and Romans 8:28.')).toEqual(['john:3:16-16', 'romans:8:28-28']);
  });

  it('handles ranges with hyphens and en/em dashes', () => {
    expect(keys('Romans 8:38-39, Psalm 23:1–6 and Isaiah 41:10—13')).toEqual([
      'romans:8:38-39',
      'psalms:23:1-6',
      'isaiah:41:10-13',
    ]);
  });

  it('handles numbered books in many forms', () => {
    expect(keys('1 Cor 13:4-7, 1 Corinthians 10:13, 2 Tim. 1:7, I John 4:18, First Peter 5:7, 1Jn 1:9')).toEqual([
      '1corinthians:13:4-7',
      '1corinthians:10:13-13',
      '2timothy:1:7-7',
      '1john:4:18-18',
      '1peter:5:7-7',
      '1john:1:9-9',
    ]);
  });

  it('prefers the numbered book over the plain one', () => {
    expect(parse('1 John 4:8')[0].book).toBe('1john');
    expect(parse('John 4:8')[0].book).toBe('john');
  });

  it('handles abbreviations with a trailing period', () => {
    expect(keys('Ps. 34:18 and Matt. 11:28 and Phil 4:6-7')).toEqual([
      'psalms:34:18-18',
      'matthew:11:28-28',
      'philippians:4:6-7',
    ]);
  });

  it('handles multi-word names', () => {
    expect(keys('Song of Solomon 2:4 and Song of Songs 8:6')).toEqual([
      'songofsolomon:2:4-4',
      'songofsolomon:8:6-6',
    ]);
  });

  it('accepts whole-chapter references', () => {
    expect(parse('Read Psalm 23 tonight.')).toEqual([
      { book: 'psalms', bookName: 'Psalms', chapter: 23 },
    ]);
    expect(keys('Psalm 23: a song of trust')).toEqual(['psalms:23']);
  });

  it('treats a cross-chapter range as a chapter link', () => {
    expect(keys('John 3:16-4:2')).toEqual(['john:3']);
  });

  it('rejects chapters that do not exist', () => {
    expect(parse('Romans 17:3 and Jude 2:1')).toEqual([]);
  });

  it('rejects backwards ranges and verse 0', () => {
    expect(parse('John 3:16-10 and John 3:0')).toEqual([]);
  });

  it('ignores lower-case words that look like books', () => {
    expect(parse('I will mark 5 days and job 2 is done')).toEqual([]);
  });

  it('ignores names glued to other words or numbers', () => {
    expect(parse('Johnson 3:16 and 41John 3:16')).toEqual([]);
  });

  it('reports position and raw text', () => {
    const [m] = parseScriptureReferences('See 1 Cor. 13:4–7 today');
    expect(m.raw).toBe('1 Cor. 13:4–7');
    expect(m.index).toBe(4);
  });
});

describe('formatting helpers', () => {
  it('formats references and read links', () => {
    const [range] = parse('Romans 8:38-39');
    expect(formatScriptureRef(range)).toBe('Romans 8:38–39');
    expect(readPath(range)).toBe('/read/romans/8?verse=38&end=39');

    const [chapter] = parse('Psalm 23');
    expect(formatScriptureRef(chapter)).toBe('Psalm 23');
    expect(readPath(chapter)).toBe('/read/psalms/23');
  });
});

describe('resolvePassage', () => {
  it('loads the real WEB text', async () => {
    const [ref] = parse('John 11:35');
    const resolved = await resolvePassage(ref);
    expect(resolved?.verses).toEqual([{ verse: 35, text: expect.stringMatching(/Jesus wept/) }]);
  });

  it('returns null for a verse that does not exist', async () => {
    const [ref] = parse('Psalm 23:40');
    expect(await resolvePassage(ref)).toBeNull();
  });

  it('clamps an end verse past the end of the chapter', async () => {
    const [ref] = parse('Psalm 23:5-12');
    const resolved = await resolvePassage(ref);
    expect(resolved?.ref.endVerse).toBe(6);
    expect(resolved?.verses.map((v) => v.verse)).toEqual([5, 6]);
  });

  it('returns null for whole-chapter references', async () => {
    const [ref] = parse('Psalm 23');
    expect(await resolvePassage(ref)).toBeNull();
  });
});
