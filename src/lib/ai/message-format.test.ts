import { describe, expect, it } from 'vitest';
import { collectVerseRefs, parseInline, parseMessage } from './message-format';
import { refKey } from './scripture-guard';

describe('parseInline', () => {
  it('splits bold, italic and references', () => {
    const tokens = parseInline('Read **Psalm 23:1** and *trust* John 3:16.');
    expect(tokens.map((t) => (t.type === 'ref' ? `[${t.match.raw}${t.bold ? ' bold' : ''}]` : `${t.text}${t.bold ? '(b)' : ''}${t.italic ? '(i)' : ''}`))).toEqual([
      'Read ',
      '[Psalm 23:1 bold]',
      ' and ',
      'trust(i)',
      ' ',
      '[John 3:16]',
      '.',
    ]);
  });

  it('leaves unclosed markers as text', () => {
    expect(parseInline('**unfinished')).toEqual([{ type: 'text', text: '**unfinished', bold: false, italic: false }]);
  });

  it('does not treat snake_case words as italic', () => {
    expect(parseInline('a_b_c')).toEqual([{ type: 'text', text: 'a_b_c', bold: false, italic: false }]);
  });
});

describe('parseMessage', () => {
  it('builds paragraphs and lists, keeping list items together across blank lines', () => {
    const blocks = parseMessage('Hello there.\nSecond line.\n\n*   **Psalm 139:7-12** – one\n\n*   Isaiah 41:10 – two\n\n1. first\n2. second\n\nBye.');
    expect(blocks.map((b) => (b.type === 'list' ? `${b.ordered ? 'ol' : 'ul'}:${b.items.length}` : `p:${b.lines.length}`))).toEqual([
      'p:2',
      'ul:2',
      'ol:2',
      'p:1',
    ]);
  });

  it('turns headings into bold text and quotes into plain paragraphs', () => {
    const [heading, quote] = parseMessage('## Comfort\n\n> “Blessed are those…” — Psalm 34:18');
    expect(heading).toEqual({ type: 'paragraph', lines: [[{ type: 'text', text: 'Comfort', bold: true, italic: false }]] });
    expect(quote.type).toBe('paragraph');
    const first = (quote as { lines: { type: string; text?: string }[][] }).lines[0][0];
    expect(first.text?.startsWith('“Blessed')).toBe(true);
  });
});

describe('collectVerseRefs', () => {
  it('returns unique verse references in order, skipping whole chapters', () => {
    const refs = collectVerseRefs('John 3:16, Psalm 23, Romans 8:28 and again John 3:16.', false);
    expect(refs.map(refKey)).toEqual(['john:3:16-16', 'romans:8:28-28']);
  });

  it('waits for a reference at the end of a streaming reply to finish', () => {
    expect(collectVerseRefs('See Romans 8:3', true)).toEqual([]);
    expect(collectVerseRefs('See Romans 8:38-39 ', true).map(refKey)).toEqual([]);
    expect(collectVerseRefs('See Romans 8:38-39 today', true).map(refKey)).toEqual(['romans:8:38-39']);
    expect(collectVerseRefs('See Romans 8:3', false).map(refKey)).toEqual(['romans:8:3-3']);
  });
});
