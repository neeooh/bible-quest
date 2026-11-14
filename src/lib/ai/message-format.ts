import { parseScriptureReferences, refKey, type RefMatch, type ScriptureRef } from './scripture-guard';

/**
 * A small, safe Markdown subset for mentor replies: paragraphs, bullet and
 * numbered lists, **bold** and *italic*. Headings become bold paragraphs.
 * Block quotes ("> …") are shown as ordinary paragraphs on purpose: text the
 * model presents as a quotation must never look like Scripture.
 */

export type InlineToken =
  | { type: 'text'; text: string; bold: boolean; italic: boolean }
  | { type: 'ref'; match: RefMatch; bold: boolean; italic: boolean };

export type Block =
  | { type: 'paragraph'; lines: InlineToken[][] }
  | { type: 'list'; ordered: boolean; items: InlineToken[][] };

const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const NUMBERED_RE = /^\s*\d+[.)]\s+(.*)$/;

/** Splits text into bold/italic runs. Unclosed markers are left as plain text. */
function splitEmphasis(text: string): { text: string; bold: boolean; italic: boolean }[] {
  const out: { text: string; bold: boolean; italic: boolean }[] = [];
  const re = /\*\*(.+?)\*\*|__(.+?)__|\*(?!\s)(.+?)(?<!\s)\*|(?<![\p{L}\d])_(?!\s)(.+?)(?<!\s)_(?![\p{L}\d])/gu;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ text: text.slice(last, index), bold: false, italic: false });
    const bold = m[1] ?? m[2];
    if (bold !== undefined) out.push({ text: bold, bold: true, italic: false });
    else out.push({ text: m[3] ?? m[4], bold: false, italic: true });
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false, italic: false });
  return out;
}

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  for (const run of splitEmphasis(text)) {
    let last = 0;
    for (const match of parseScriptureReferences(run.text)) {
      if (match.index > last) {
        tokens.push({ type: 'text', text: run.text.slice(last, match.index), bold: run.bold, italic: run.italic });
      }
      tokens.push({ type: 'ref', match, bold: run.bold, italic: run.italic });
      last = match.index + match.raw.length;
    }
    if (last < run.text.length) {
      tokens.push({ type: 'text', text: run.text.slice(last), bold: run.bold, italic: run.italic });
    }
  }
  return tokens;
}

function cleanLine(line: string): string {
  return line
    .replace(/^\s*#{1,6}\s+(.*)$/, '**$1**') // heading → bold
    .replace(/^\s*>\s?/, ''); // quote marker → plain text
}

export function parseMessage(content: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: InlineToken[][] = [];
  let list: { ordered: boolean; items: InlineToken[][] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: 'list', ...list });
    list = null;
  };

  for (const rawLine of content.replace(/\r\n?/g, '\n').split('\n')) {
    if (!rawLine.trim()) {
      flushParagraph();
      // Keep list items together across the blank lines models like to add.
      continue;
    }
    const line = cleanLine(rawLine);
    const bullet = BULLET_RE.exec(line);
    const numbered = bullet ? null : NUMBERED_RE.exec(line);
    const item = bullet ?? numbered;

    if (item) {
      flushParagraph();
      const ordered = !!numbered;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(parseInline(item[1]));
    } else {
      flushList();
      paragraph.push(parseInline(line.trim()));
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

/**
 * Unique verse references in a reply, in order of appearance. While the reply
 * is still streaming, a reference at the very end is skipped because it may
 * still grow (e.g. "Romans 8:3" → "Romans 8:38-39").
 */
export function collectVerseRefs(content: string, streaming: boolean): ScriptureRef[] {
  const end = content.trimEnd().length;
  const seen = new Set<string>();
  const refs: ScriptureRef[] = [];
  for (const m of parseScriptureReferences(content)) {
    if (m.ref.startVerse === undefined) continue;
    if (streaming && m.index + m.raw.length >= end) continue;
    const key = refKey(m.ref);
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push(m.ref);
  }
  return refs;
}
