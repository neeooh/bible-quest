import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, BookMarked, ArrowRight } from 'lucide-react';
import { loadBook } from '../lib/bible';
import { getLastRead } from '../lib/last-read';
import {
  getOldTestamentBooks,
  getNewTestamentBooks,
  getBookBySlug,
} from '../lib/book-metadata';
import type { BibleData } from '../lib/types';

export default function LibraryPage() {
  const navigate = useNavigate();
  const otBooks = getOldTestamentBooks();
  const ntBooks = getNewTestamentBooks();

  const [selectedBook, setSelectedBook] = useState<string>('');
  const lastRead = getLastRead();
  const [bookData, setBookData] = useState<BibleData | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);

  const bookMeta = selectedBook ? getBookBySlug(selectedBook) : undefined;
  const bookName = bookMeta?.name ?? '';

  useEffect(() => {
    if (!selectedBook) {
      setBookData(null);
      return;
    }
    setBookLoading(true);
    loadBook(selectedBook)
      .then(setBookData)
      .finally(() => setBookLoading(false));
  }, [selectedBook]);

  const chapters = bookData?.chapters ?? [];
  const chapter = selectedChapter
    ? chapters.find((c) => c.chapter === selectedChapter)
    : undefined;
  const maxVerse = chapter ? chapter.verses.length : 1;

  function handleBookChange(slug: string) {
    setSelectedBook(slug);
    setSelectedChapter(0);
    setSelectedVerse(1);
  }

  function handleChapterChange(num: number) {
    setSelectedChapter(num);
    setSelectedVerse(1);
  }

  function handleGo() {
    if (!selectedBook || !selectedChapter) return;
    navigate(`/read/${selectedBook}/${selectedChapter}?verse=${selectedVerse}`);
  }

  return (
    <div className="py-10 space-y-10">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">Library</h1>
        </div>
        <p className="text-cream/40 text-sm">
          66 books &middot; World English Bible
        </p>
      </div>

      {/* Continue Reading */}
      {lastRead && (
        <div className="max-w-2xl mx-auto">
          <Link
            to={`/read/${lastRead.book}/${lastRead.chapter}`}
            className="card flex items-center gap-4 group hover:border-gold-500/30 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0 group-hover:bg-gold-500/20 transition-colors">
              <BookMarked className="w-5 h-5 text-gold-500" />
            </div>
            <div className="min-w-0">
              <p className="text-cream/50 text-xs font-medium">Continue Reading</p>
              <p className="text-cream font-serif font-semibold group-hover:text-gold-400 transition-colors">
                {lastRead.bookName} {lastRead.chapter}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-cream/30 ml-auto shrink-0 group-hover:text-gold-400 transition-colors" />
          </Link>
        </div>
      )}

      {/* Testament Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Link
          to="/library/testament/ot"
          className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer flex flex-col items-center text-center py-10 space-y-3"
        >
          <div className="w-14 h-14 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
            <BookOpen className="w-7 h-7 text-gold-500" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors">
            Old Testament
          </h2>
          <p className="text-cream/40 text-sm">{otBooks.length} books</p>
        </Link>

        <Link
          to="/library/testament/nt"
          className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer flex flex-col items-center text-center py-10 space-y-3"
        >
          <div className="w-14 h-14 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
            <BookOpen className="w-7 h-7 text-gold-500" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors">
            New Testament
          </h2>
          <p className="text-cream/40 text-sm">{ntBooks.length} books</p>
        </Link>
      </div>

      {/* Go to a Passage */}
      <section className="card space-y-4 max-w-2xl mx-auto">
        <h2 className="text-sm font-medium text-cream/50">Go to a Passage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label htmlFor="lib-book" className="text-xs text-cream/40">
              Book
            </label>
            <select
              id="lib-book"
              value={selectedBook}
              onChange={(e) => handleBookChange(e.target.value)}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50"
            >
              <option value="">Select book</option>
              <optgroup label="Old Testament">
                {otBooks.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="New Testament">
                {ntBooks.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lib-chapter" className="text-xs text-cream/40">
              Chapter
            </label>
            <select
              id="lib-chapter"
              value={selectedChapter}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              disabled={!selectedBook || bookLoading}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
            >
              <option value={0}>Select chapter</option>
              {chapters.map((ch) => (
                <option key={ch.chapter} value={ch.chapter}>
                  {bookName} {ch.chapter}
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
              disabled={!selectedBook || !selectedChapter}
              className="btn-gold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>
        </div>

        {bookLoading && (
          <div className="flex items-center gap-2 text-cream/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading book data…
          </div>
        )}
      </section>
    </div>
  );
}
