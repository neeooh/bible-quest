import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { loadBook } from '../lib/bible';
import { getBookBySlug } from '../lib/book-metadata';
import { useProgress } from '../hooks/useProgress';
import type { BibleData } from '../lib/types';

export default function BookChaptersPage() {
  const { book: bookSlug } = useParams<{ book: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();

  const meta = bookSlug ? getBookBySlug(bookSlug) : undefined;
  const [bookData, setBookData] = useState<BibleData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);

  useEffect(() => {
    if (!bookSlug) return;
    setLoading(true);
    loadBook(bookSlug)
      .then(setBookData)
      .finally(() => setLoading(false));
  }, [bookSlug]);

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

  const chapters = bookData.chapters;
  const chapter = selectedChapter
    ? chapters.find((c) => c.chapter === selectedChapter)
    : undefined;
  const maxVerse = chapter ? chapter.verses.length : 1;

  function handleChapterChange(num: number) {
    setSelectedChapter(num);
    setSelectedVerse(1);
  }

  function handleGo() {
    if (!selectedChapter) return;
    navigate(`/read/${bookSlug}/${selectedChapter}?verse=${selectedVerse}`);
  }

  return (
    <div className="py-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Link
            to="/library"
            className="text-cream/40 hover:text-cream transition-colors"
            aria-label="Back to library"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <BookOpen className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">
            {meta.name}
          </h1>
        </div>
        <p className="text-cream/40 text-sm">
          {chapters.length} chapters &middot; World English Bible
        </p>
      </div>

      {/* Passage Selector */}
      <section className="card space-y-4">
        <h2 className="text-sm font-medium text-cream/50">Go to a Passage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label htmlFor="lib-chapter" className="text-xs text-cream/40">
              Chapter
            </label>
            <select
              id="lib-chapter"
              value={selectedChapter}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50"
            >
              <option value={0}>Select chapter</option>
              {chapters.map((ch) => (
                <option key={ch.chapter} value={ch.chapter}>
                  {meta.name} {ch.chapter}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lib-verse" className="text-xs text-cream/40">
              Verse
            </label>
            <select
              id="lib-verse"
              value={selectedVerse}
              onChange={(e) => setSelectedVerse(Number(e.target.value))}
              disabled={!selectedChapter}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
            >
              {Array.from({ length: maxVerse }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>
                  Verse {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGo}
              disabled={!selectedChapter}
              className="btn-gold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>
        </div>
      </section>

      {/* Chapter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chapters.map((ch) => {
          const cardPreview = ch.verses
            .slice(0, 2)
            .map((v) => v.text)
            .join(' ')
            .slice(0, 80);

          const isExplored = progress.chaptersExplored.includes(
            `${bookSlug}:${ch.chapter}`,
          );

          return (
            <Link
              key={ch.chapter}
              to={`/read/${bookSlug}/${ch.chapter}`}
              className={`card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer relative${
                isExplored ? ' border-l-2 border-l-gold-500' : ''
              }`}
            >
              {isExplored && (
                <div className="absolute top-2 right-2">
                  <Check className="w-3.5 h-3.5 text-gold-500" />
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors">
                    Chapter {ch.chapter}
                  </h2>
                  <span className="text-xs text-cream/30">
                    {ch.verses.length} verses
                  </span>
                </div>
                <p className="text-cream/40 text-xs leading-relaxed line-clamp-2">
                  {cardPreview}&hellip;
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
