import { Link } from 'react-router-dom';
import { BookOpen, BookmarkCheck, BookmarkPlus, Heart } from 'lucide-react';
import { formatScriptureRef, readPath, type ResolvedPassage } from '../../lib/ai/scripture-guard';
import type { UseSavedVersesReturn } from '../../hooks/useSavedVerses';
import { showToast } from '../Toast';

interface VerseCardProps {
  passage: ResolvedPassage;
  saved: UseSavedVersesReturn;
}

/**
 * A passage the mentor cited, shown with the exact World English Bible text
 * from the bundled data — never the model's own wording.
 */
export default function VerseCard({ passage, saved }: VerseCardProps) {
  const { ref, verses } = passage;
  const reference = formatScriptureRef(ref);
  const { book, bookName, chapter } = ref;

  const allSaved = verses.every((v) => saved.isSaved(book, chapter, v.verse));
  const allFavourite = verses.every((v) => saved.isFavourite(book, chapter, v.verse));

  const toSaved = (verse: number, text: string, favourite: boolean) => ({
    book,
    chapter,
    verse,
    text,
    reference: `${bookName} ${chapter}:${verse}`,
    favourite,
  });

  const toggleFavourite = () => {
    if (allFavourite) {
      for (const v of verses) saved.setFavourite(book, chapter, v.verse, false);
      showToast('Removed from favourites', 'info');
      return;
    }
    for (const v of verses) {
      if (saved.isSaved(book, chapter, v.verse)) saved.setFavourite(book, chapter, v.verse, true);
      else saved.addVerse(toSaved(v.verse, v.text, true));
    }
    showToast(`${reference} added to favourites`, 'success');
  };

  const addToMyVerses = () => {
    if (allSaved) return;
    saved.addVerses(
      verses
        .filter((v) => !saved.isSaved(book, chapter, v.verse))
        .map((v) => toSaved(v.verse, v.text, false)),
    );
    showToast(`${reference} added to My Verses`, 'success');
  };

  return (
    <figure className="h-full flex flex-col gap-3 rounded-xl border border-gold-500/20 bg-navy-700/50 p-4">
      <figcaption className="flex items-center justify-between gap-3">
        <span className="text-gold-400 text-sm font-semibold">{reference}</span>
        <span className="text-cream/30 text-[10px] uppercase tracking-wider">WEB</span>
      </figcaption>

      <blockquote className="border-l-2 border-gold-500/60 pl-4 font-serif text-cream/90 text-lg leading-relaxed">
        {verses.map((v) => (
          <span key={v.verse}>
            {verses.length > 1 && <span className="verse-number">{v.verse}</span>}
            {v.text}{' '}
          </span>
        ))}
      </blockquote>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleFavourite}
          aria-pressed={allFavourite}
          className="btn-outline text-xs !px-3 !py-2 inline-flex items-center gap-1.5"
        >
          <Heart className={`w-3.5 h-3.5 ${allFavourite ? 'text-red-400' : ''}`} fill={allFavourite ? 'currentColor' : 'none'} />
          {allFavourite ? 'Favourited' : 'Favourite'}
        </button>
        <button
          type="button"
          onClick={addToMyVerses}
          disabled={allSaved}
          className="btn-outline text-xs !px-3 !py-2 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:active:scale-100"
        >
          {allSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
          {allSaved ? 'In My Verses' : 'Add to My Verses'}
        </button>
        <Link
          to={readPath(ref)}
          className="btn-outline text-xs !px-3 !py-2 inline-flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Read
        </Link>
      </div>
    </figure>
  );
}
