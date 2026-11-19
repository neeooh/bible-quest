import type { ReactNode } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { formatScriptureRef, readPath, type ResolvedPassage } from '../../lib/ai/scripture-guard';
import type { UseSavedVersesReturn } from '../../hooks/useSavedVerses';
import { copyVerse, memorisePath, shareVerse } from '../../lib/verse-actions';
import { showToast } from '../Toast';
import SharedVerseCard from '../verse/VerseCard';

interface VerseCardProps {
  passage: ResolvedPassage;
  saved: UseSavedVersesReturn;
  /** Header-right slot — the carousel puts its pager here. */
  aside?: ReactNode;
}

/**
 * A passage the mentor cited, shown with the exact World English Bible text
 * from the bundled data — never the model's own wording.
 */
export default function VerseCard({ passage, saved, aside }: VerseCardProps) {
  const { ref, verses } = passage;
  const reference = formatScriptureRef(ref);
  const { book, bookName, chapter } = ref;
  const first = verses[0]?.verse ?? ref.startVerse ?? 1;
  const last = verses[verses.length - 1]?.verse ?? first;
  const fullText = verses.map((v) => v.text).join(' ');

  const allFavourite = verses.every((v) => saved.isFavourite(book, chapter, v.verse));

  // Favouriting is how a passage enters My Verses, everywhere in the app.
  const toggleFavourite = () => {
    if (allFavourite) {
      for (const v of verses) saved.setFavourite(book, chapter, v.verse, false);
      showToast('Removed from favourites', 'info');
      return;
    }
    for (const v of verses) {
      if (saved.isSaved(book, chapter, v.verse)) saved.setFavourite(book, chapter, v.verse, true);
      else
        saved.addVerse({
          book,
          chapter,
          verse: v.verse,
          text: v.text,
          reference: `${bookName} ${chapter}:${v.verse}`,
          favourite: true,
        });
    }
    showToast(`${reference} added to favourites`, 'success');
  };

  return (
    <SharedVerseCard
      variant="cited"
      reference={reference}
      readHref={readPath(ref)}
      verses={verses}
      aside={aside}
      favourite={{ active: allFavourite, onToggle: toggleFavourite }}
      menu={[
        { label: 'Copy passage', icon: Copy, onSelect: () => copyVerse(fullText, reference) },
        { label: 'Share', icon: Share2, onSelect: () => shareVerse(fullText, reference) },
      ]}
      primary={{ label: 'Practise', to: memorisePath(book, chapter, first, last) }}
    />
  );
}
