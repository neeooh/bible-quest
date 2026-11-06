import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, BookMarked, ArrowRight, Search, X } from 'lucide-react';
import { loadBook, searchBible, type SearchResult } from '../lib/bible';
import { getLastRead } from '../lib/last-read';
import TopicIcon from '../components/TopicIcon';
import { TOPICS } from '../lib/topics';
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchBible(query, 50);
      setSearchResults(results);
      setHasSearched(true);
      setSearching(false);
    }, 400);
  }, []);

  function clearSearch() {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSearching(false);
  }

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

      {/* Search */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search the Bible..."
            className="w-full bg-navy-700 border border-gold-500/20 rounded-lg pl-10 pr-10 py-3 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searching && (
          <div className="flex items-center gap-2 text-cream/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching...
          </div>
        )}

        {hasSearched && !searching && (
          <div className="space-y-3">
            <p className="text-cream/40 text-xs">
              {searchResults.length === 50
                ? '50+ results'
                : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
              {' '}for &ldquo;{searchQuery}&rdquo;
            </p>
            {searchResults.length === 0 ? (
              <div className="card text-center py-6">
                <p className="text-cream/40 text-sm">No verses found.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {searchResults.map((r) => (
                  <Link
                    key={`${r.book}:${r.chapter}:${r.verse}`}
                    to={`/read/${r.book}/${r.chapter}?verse=${r.verse}`}
                    className="card block py-4 group hover:border-gold-500/30 transition-colors"
                  >
                    <p className="text-gold-400 text-sm font-semibold font-serif group-hover:text-gold-300 transition-colors">
                      {r.reference}
                    </p>
                    <p className="text-cream/60 text-sm mt-1 leading-relaxed line-clamp-2">
                      {r.text}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Go to a Passage */}
      <section className="card space-y-4 max-w-2xl mx-auto">
        <h2 className="text-sm font-medium text-cream/50">Go to a Passage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          <div className="">
            <label htmlFor="lib-book" className="block text-xs text-cream/40 mb-2">
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

          <div className="">
            <label htmlFor="lib-chapter" className="block text-xs text-cream/40 mb-2">
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

          <div className="">
            <label htmlFor="lib-verse" className="block text-xs text-cream/40 mb-2">
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

      {/* Topics */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">
          Explore by Topic
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              to={`/topics/${topic.slug}`}
              className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer !p-4 flex items-center gap-3"
            >
              <span className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0 text-gold-400 group-hover:bg-gold-500/20 transition-colors">
                <TopicIcon name={topic.icon} className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors text-sm">
                  {topic.name}
                </h3>
                <span className="text-xs text-cream/30">
                  {topic.passages.length} passages
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
