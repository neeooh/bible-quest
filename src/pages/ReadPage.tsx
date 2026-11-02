import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  BookOpen,
  Heart,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { loadBook, formatReference } from '../lib/bible';
import { getBookBySlug } from '../lib/book-metadata';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { saveLastRead } from '../lib/last-read';
import { showToast } from '../components/Toast';
import type { BibleData } from '../lib/types';

export default function ReadPage() {
  const { book: bookSlug, chapter: chapterParam } = useParams<{
    book: string;
    chapter: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetVerse = searchParams.get('verse');

  const meta = bookSlug ? getBookBySlug(bookSlug) : undefined;
  const bookName = meta?.name ?? bookSlug ?? '';
  const num = Number(chapterParam) || 1;

  const [bookData, setBookData] = useState<BibleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());

  const { markChapterExplored, progress } = useProgress();
  const { addVerses, isSaved } = useSavedVerses();
  const toastedChapterRef = useRef<string | null>(null);

  // Load book data
  useEffect(() => {
    if (!bookSlug) return;
    setLoading(true);
    loadBook(bookSlug)
      .then(setBookData)
      .finally(() => setLoading(false));
  }, [bookSlug]);

  const chapter = bookData?.chapters.find((ch) => ch.chapter === num);
  const total = bookData?.chapters.length ?? 0;

  // Mark chapter explored and save reading position
  useEffect(() => {
    if (!bookSlug || !chapter) return;
    const key = `${bookSlug}:${num}`;
    const alreadyExplored = progress.chaptersExplored.includes(key);
    markChapterExplored(bookSlug, num);
    saveLastRead(bookSlug, bookName, num);
    if (!alreadyExplored && toastedChapterRef.current !== key) {
      toastedChapterRef.current = key;
      showToast(`${bookName} ${num} explored!`, 'info');
    }
  }, [bookSlug, num, chapter]);

  // Scroll to target verse
  useEffect(() => {
    if (!targetVerse) return;
    const verseNum = Number(targetVerse);
    if (!verseNum) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`verse-${verseNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('verse-flash');
        setTimeout(() => el.classList.remove('verse-flash'), 3000);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [targetVerse, loading]);

  // Clear selection on chapter change
  useEffect(() => {
    setSelectedVerses(new Set());
  }, [bookSlug, num]);

  const { startV, endV } = useMemo(() => {
    if (selectedVerses.size === 0) return { startV: 0, endV: 0 };
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    return { startV: sorted[0], endV: sorted[sorted.length - 1] };
  }, [selectedVerses]);

  const allSelectedSaved = useMemo(() => {
    if (selectedVerses.size === 0 || !bookSlug) return false;
    return Array.from(selectedVerses).every((v) =>
      isSaved(bookSlug, num, v),
    );
  }, [selectedVerses, isSaved, bookSlug, num]);

  if (!meta) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-cream/50 text-lg">Book not found.</p>
        <Link to="/library" className="btn-outline inline-block">
          Back to Library
        </Link>
      </div>
    );
  }

  if (loading || !bookData) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-cream/50 text-lg">Chapter not found.</p>
        <Link to={`/library/${bookSlug}`} className="btn-outline inline-block">
          Back to {bookName}
        </Link>
      </div>
    );
  }

  function toggleVerse(verseNum: number) {
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseNum)) {
        next.delete(verseNum);
      } else {
        next.add(verseNum);
      }
      return next;
    });
  }

  function handleAddSelectedToMyVerses() {
    if (!chapter || !bookSlug) return;
    const versesToAdd = chapter.verses
      .filter((v) => selectedVerses.has(v.verse))
      .map((v) => ({
        book: bookSlug,
        chapter: num,
        verse: v.verse,
        text: v.text,
        reference: formatReference(bookName, num, v.verse),
      }));
    addVerses(versesToAdd);
    const count = versesToAdd.length;
    showToast(
      `Added ${count} verse${count > 1 ? 's' : ''} to My Verses`,
      'success',
    );
  }

  return (
    <div className="py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/library/${bookSlug}`}
            className="text-cream/40 hover:text-cream transition-colors"
            aria-label={`Back to ${bookName}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-cream">
            {bookName} {num}
          </h1>
        </div>

        {/* Font size controls */}
        <div className="flex items-center gap-2">
          <span className="text-cream/40 text-xs font-medium tracking-wide mr-1">
            Aa
          </span>
          <button
            type="button"
            onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
            className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/50 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
            aria-label="Decrease font size"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-cream/30 text-xs w-8 text-center">
            {fontSize}
          </span>
          <button
            type="button"
            onClick={() => setFontSize((prev) => Math.min(28, prev + 2))}
            className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/50 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
            aria-label="Increase font size"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selection hint */}
      <p className="text-cream/30 text-xs">
        Tap any verse to select it for memorisation.
      </p>

      {/* Verses */}
      <div
        className="space-y-1 leading-relaxed"
        style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
      >
        {chapter.verses.map((v) => {
          const isSelected = selectedVerses.has(v.verse);
          return (
            <span key={v.verse}>
              {v.verse > 1 && v.verse % 6 === 1 && (
                <span className="block mt-5" />
              )}
              <span
                id={`verse-${v.verse}`}
                role="button"
                tabIndex={0}
                onClick={() => toggleVerse(v.verse)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleVerse(v.verse);
                  }
                }}
                className={`inline cursor-pointer rounded px-0.5 -mx-0.5 transition-colors ${
                  isSelected
                    ? 'bg-gold-500/20 text-cream'
                    : 'hover:bg-gold-500/10'
                }`}
              >
                <sup className="verse-number">{v.verse}</sup>
                <span className="verse-text">{v.text} </span>
              </span>
            </span>
          );
        })}
      </div>

      {/* Chapter navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-gold-500/10">
        {num > 1 ? (
          <button
            type="button"
            onClick={() => navigate(`/read/${bookSlug}/${num - 1}`)}
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Chapter {num - 1}
          </button>
        ) : (
          <div />
        )}
        {num < total ? (
          <button
            type="button"
            onClick={() => navigate(`/read/${bookSlug}/${num + 1}`)}
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            Chapter {num + 1}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Floating action bar */}
      {selectedVerses.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex gap-3 bg-navy-900/95 backdrop-blur-sm border border-gold-500/20 rounded-xl px-4 py-3 shadow-lg shadow-navy-900/50">
          <Link
            to={`/memorize?book=${bookSlug}&chapter=${num}&start=${startV}&end=${endV}`}
            className="btn-gold inline-flex items-center gap-2 shadow-lg shadow-navy-900/50 text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Memorise Selected ({selectedVerses.size} verse
            {selectedVerses.size > 1 ? 's' : ''})
          </Link>
          <button
            type="button"
            onClick={handleAddSelectedToMyVerses}
            disabled={allSelectedSaved}
            className={`btn-outline inline-flex items-center gap-2 shadow-lg shadow-navy-900/50 text-sm ${allSelectedSaved ? 'opacity-50 cursor-default' : ''}`}
          >
            {allSelectedSaved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Heart className="w-4 h-4" />
            )}
            {allSelectedSaved ? 'Saved' : 'Add to My Verses'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedVerses(new Set())}
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      )}

      {/* Sticky hint bar */}
      {selectedVerses.size === 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-navy-800/90 backdrop-blur-sm border-t border-gold-500/10 py-3 text-center z-30">
          <p className="text-cream/40 text-sm">
            Select verses above to start memorising
          </p>
        </div>
      )}
    </div>
  );
}
