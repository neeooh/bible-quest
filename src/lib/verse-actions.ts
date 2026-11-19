import { showToast } from '../components/Toast';

/** "<text>" — <reference> (WEB): the format used for copying and sharing. */
export function verseShareText(text: string, reference: string): string {
  return `${text.trim()} — ${reference} (WEB)`;
}

export function copyVerse(text: string, reference: string): void {
  navigator.clipboard
    .writeText(verseShareText(text, reference))
    .then(() => showToast('Verse copied to clipboard', 'success'))
    .catch(() => showToast('Could not copy the verse', 'info'));
}

export function shareVerse(text: string, reference: string): void {
  const shareText = verseShareText(text, reference);
  if (navigator.share) {
    navigator.share({ text: shareText }).catch(() => {});
    return;
  }
  navigator.clipboard.writeText(shareText).then(() => showToast('Copied to clipboard', 'success'));
}

/** Link to the memorise screen for a passage. */
export function memorisePath(book: string, chapter: number, start: number, end: number = start): string {
  return `/memorize?book=${book}&chapter=${chapter}&start=${start}&end=${end}`;
}

/** Link to the reader, scrolled to the passage. */
export function readVersePath(book: string, chapter: number, start: number, end: number = start): string {
  return `/read/${book}/${chapter}?verse=${start}${end !== start ? `&end=${end}` : ''}`;
}

/** What the primary button says: named for what happens next. */
export function practiseLabel(timesCompleted: number, due: boolean): string {
  if (due) return 'Review';
  return timesCompleted > 0 ? 'Practise' : 'Start';
}

/** Rough time to memorise a passage: about 8 words a minute, at least 2 minutes. */
export function memoriseMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 8));
}
