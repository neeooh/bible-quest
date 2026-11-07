import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  BookOpen,
  Heart,
  Loader2,
  X,
  BookmarkPlus,
  Bookmark,
  Copy,
  Share2,
  Volume2,
  VolumeX,
  MoreVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { loadBook, formatReference } from '../lib/bible';
import { getBookBySlug } from '../lib/book-metadata';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
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
  const [showSettings, setShowSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const { markChapterExplored, progress } = useProgress();
  const { addVerse, addVerses, removeVerse, isSaved, isFavourite, setFavourite } = useSavedVerses();
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();
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

  // Mark chapter explored
  useEffect(() => {
    if (!bookSlug || !chapter) return;
    const key = `${bookSlug}:${num}`;
    const alreadyExplored = progress.chaptersExplored.includes(key);
    markChapterExplored(bookSlug, num);
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
    setShowSettings(false);
  }, [bookSlug, num]);

  // Toggle fullscreen reading mode via document attribute
  useEffect(() => {
    if (fullscreen) {
      document.documentElement.setAttribute('data-reader-fullscreen', '');
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setFullscreen(false);
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        document.documentElement.removeAttribute('data-reader-fullscreen');
        window.removeEventListener('keydown', handleKey);
      };
    } else {
      document.documentElement.removeAttribute('data-reader-fullscreen');
    }
  }, [fullscreen]);

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

  const allSelectedFavourited = useMemo(() => {
    if (selectedVerses.size === 0 || !bookSlug) return false;
    return Array.from(selectedVerses).every((v) =>
      isFavourite(bookSlug, num, v),
    );
  }, [selectedVerses, isFavourite, bookSlug, num]);

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

  function handleToggleSave() {
    if (!chapter || !bookSlug) return;
    if (allSelectedSaved) {
      // Unsave all selected
      for (const v of selectedVerses) {
        if (isSaved(bookSlug, num, v)) {
          removeVerse(bookSlug, num, v);
        }
      }
      showToast('Removed from My Verses', 'info');
    } else {
      // Save all selected
      const versesToAdd = chapter.verses
        .filter((v) => selectedVerses.has(v.verse))
        .map((v) => ({
          book: bookSlug,
          chapter: num,
          verse: v.verse,
          text: v.text,
          reference: formatReference(bookName, num, v.verse),
          favourite: false,
        }));
      addVerses(versesToAdd);
      showToast(`Saved ${versesToAdd.length} verse${versesToAdd.length > 1 ? 's' : ''}`, 'success');
    }
  }

  function handleToggleFavourite() {
    if (!chapter || !bookSlug) return;
    if (allSelectedFavourited) {
      // Unfavourite all selected
      for (const v of selectedVerses) {
        if (isFavourite(bookSlug, num, v)) {
          setFavourite(bookSlug, num, v, false);
        }
      }
      showToast('Removed from favourites', 'info');
    } else {
      // Favourite all selected (auto-save if needed)
      for (const v of selectedVerses) {
        if (!isSaved(bookSlug, num, v)) {
          const verse = chapter.verses.find((cv) => cv.verse === v);
          if (verse) {
            addVerse({
              book: bookSlug,
              chapter: num,
              verse: v,
              text: verse.text,
              reference: formatReference(bookName, num, v),
            });
          }
        } else if (!isFavourite(bookSlug, num, v)) {
          setFavourite(bookSlug, num, v, true);
        }
      }
      showToast('Added to favourites', 'success');
    }
  }

  function handleCopy() {
    if (!chapter || !bookSlug) return;
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    const text = chapter.verses
      .filter((v) => sorted.includes(v.verse))
      .map((v) => v.text)
      .join(' ');
    const ref = sorted.length === 1
      ? formatReference(bookName, num, sorted[0])
      : formatReference(bookName, num, sorted[0], sorted[sorted.length - 1]);
    navigator.clipboard.writeText(`"${text}" — ${ref} (WEB)`).then(() => {
      showToast('Copied to clipboard', 'success');
    });
  }

  function handleListen() {
    if (isSpeaking) {
      stop();
    } else if (chapter) {
      const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
      const text = chapter.verses
        .filter((v) => sorted.includes(v.verse))
        .map((v) => v.text)
        .join(' ');
      speak(text);
    }
  }

  function handleShare() {
    if (!chapter || !bookSlug) return;
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    const text = chapter.verses
      .filter((v) => sorted.includes(v.verse))
      .map((v) => v.text)
      .join(' ');
    const ref = sorted.length === 1
      ? formatReference(bookName, num, sorted[0])
      : formatReference(bookName, num, sorted[0], sorted[sorted.length - 1]);
    const shareText = `"${text}" — ${ref} (WEB)`;
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Copied to clipboard', 'success');
      });
    }
  }

  return (
    <div className="py-6 sm:py-10 space-y-4 sm:space-y-6">
      {/* Header — hidden in fullscreen */}
      {!fullscreen && (
        <>
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

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Fullscreen toggle */}
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/50 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
                aria-label="Enter fullscreen reading mode"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Mobile: overflow menu toggle */}
              <button
                type="button"
                onClick={() => setShowSettings((s) => !s)}
                className="sm:hidden w-9 h-9 rounded-lg border border-gold-500/20 text-cream/50 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
                aria-label="Reading settings"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Desktop: inline controls */}
              <button
                type="button"
                onClick={() => {
                  if (bookSlug) {
                    saveLastRead(bookSlug, bookName, num);
                    showToast(`Reading position saved: ${bookName} ${num}`, 'success');
                  }
                }}
                className="hidden sm:flex rounded-lg border border-gold-500/20 text-cream/50 hover:text-gold-400 hover:border-gold-500/40 transition-colors items-center gap-1.5 px-3 py-2 text-xs"
                aria-label="Save reading position"
                title="Save reading position"
              >
                <BookmarkPlus className="w-4 h-4" />
                Save Position
              </button>

              <div className="hidden sm:flex items-center gap-2">
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
          </div>

          {/* Mobile settings panel */}
          {showSettings && (
            <div className="sm:hidden flex items-center justify-between gap-3 px-3 py-3 bg-navy-800/50 rounded-xl border border-gold-500/10">
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
              <button
                type="button"
                onClick={() => {
                  if (bookSlug) {
                    saveLastRead(bookSlug, bookName, num);
                    showToast(`Reading position saved: ${bookName} ${num}`, 'success');
                  }
                }}
                className="rounded-lg border border-gold-500/20 text-cream/50 hover:text-gold-400 hover:border-gold-500/40 transition-colors flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap"
                aria-label="Save reading position"
              >
                <BookmarkPlus className="w-4 h-4" />
                Save Position
              </button>
            </div>
          )}
        </>
      )}

      {/* Fullscreen: sticky top bar with chapter title + exit */}
      {fullscreen && (
        <div className="sticky top-0 z-40 -mx-4 px-4 py-2 bg-navy-900 flex items-center justify-between">
          <span className="text-cream/40 text-sm font-serif">
            {bookName} {num}
          </span>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="w-8 h-8 rounded-lg border border-gold-500/20 text-cream/40 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Verses */}
      <div
        className="space-y-1 leading-relaxed"
        style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
      >
        {chapter.verses.map((v) => {
          const isSelected = selectedVerses.has(v.verse);
          const isSavedVerse = bookSlug ? isSaved(bookSlug, num, v.verse) : false;
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
                    : isSavedVerse
                      ? 'bg-blue-500/20 hover:bg-blue-500/30'
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
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-5xl mx-auto flex flex-col items-center gap-2">
          {/* Mobile overflow row — secondary actions */}
          {showMoreActions && (
            <div className="sm:hidden flex justify-center gap-2 bg-navy-900/95 backdrop-blur-sm border border-gold-500/20 rounded-xl px-3 py-2 shadow-lg shadow-navy-900/50">
              <button
                type="button"
                onClick={handleToggleFavourite}
                className={`w-10 h-10 rounded-lg border transition-all duration-200 active:scale-95 flex items-center justify-center ${
                  allSelectedFavourited ? 'border-red-400/30 text-red-400' : 'border-gold-500/30 text-gold-300 hover:bg-gold-500/10'
                }`}
                aria-label={allSelectedFavourited ? 'Unfavourite' : 'Favourite'}
                title={allSelectedFavourited ? 'Unfavourite' : 'Favourite'}
              >
                <Heart className="w-4 h-4" fill={allSelectedFavourited ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition-all duration-200 active:scale-95 flex items-center justify-center"
                aria-label="Copy"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
              {ttsSupported && (
                <button
                  type="button"
                  onClick={handleListen}
                  className="w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition-all duration-200 active:scale-95 flex items-center justify-center"
                  aria-label={isSpeaking ? 'Stop' : 'Listen'}
                  title={isSpeaking ? 'Stop' : 'Listen'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition-all duration-200 active:scale-95 flex items-center justify-center"
                aria-label="Share"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Primary action bar */}
          <div className="flex justify-center items-center gap-2 bg-navy-900/95 backdrop-blur-sm border border-gold-500/20 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg shadow-navy-900/50 w-full">
            <Link
              to={`/memorize?book=${bookSlug}&chapter=${num}&start=${startV}&end=${endV}`}
              className="btn-gold inline-flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Memorise Selected</span>
              <span className="sm:hidden">Memorise</span>
              ({selectedVerses.size})
            </Link>
            <button
              type="button"
              onClick={handleToggleSave}
              className={`btn-outline inline-flex items-center justify-center gap-2 text-sm max-sm:w-10 max-sm:h-10 max-sm:p-0 ${
                allSelectedSaved ? 'border-blue-400/30 text-blue-400' : ''
              }`}
              title={allSelectedSaved ? 'Saved' : 'Save'}
            >
              <Bookmark
                className="w-4 h-4"
                fill={allSelectedSaved ? 'currentColor' : 'none'}
              />
              <span className="hidden sm:inline">{allSelectedSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Desktop: secondary actions inline */}
            <button
              type="button"
              onClick={handleToggleFavourite}
              className={`hidden sm:inline-flex btn-outline items-center justify-center gap-2 text-sm ${
                allSelectedFavourited ? 'border-red-400/30 text-red-400' : ''
              }`}
            >
              <Heart className="w-4 h-4" fill={allSelectedFavourited ? 'currentColor' : 'none'} />
              {allSelectedFavourited ? 'Favourited' : 'Favourite'}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="hidden sm:inline-flex btn-outline items-center justify-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            {ttsSupported && (
              <button
                type="button"
                onClick={handleListen}
                className="hidden sm:inline-flex btn-outline items-center justify-center gap-2 text-sm"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isSpeaking ? 'Stop' : 'Listen'}
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="hidden sm:inline-flex btn-outline items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            {/* Mobile: overflow toggle */}
            <button
              type="button"
              onClick={() => setShowMoreActions((s) => !s)}
              className="sm:hidden w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 active:scale-95 transition-all duration-200 flex items-center justify-center"
              aria-label="More actions"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => { setSelectedVerses(new Set()); setShowMoreActions(false); }}
              className="w-10 h-10 rounded-lg border border-gold-500/20 text-cream/40 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
              aria-label="Clear selection"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
