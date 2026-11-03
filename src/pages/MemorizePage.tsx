import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Puzzle, Layers, AlignLeft, Loader2, Brain, ChevronDown, ChevronUp, CaseSensitive, Shuffle } from 'lucide-react';
import { loadBook, formatReference } from '../lib/bible';
import {
  getBookBySlug,
  getOldTestamentBooks,
  getNewTestamentBooks,
} from '../lib/book-metadata';
import { useProgress } from '../hooks/useProgress';
import { showToast } from '../components/Toast';
import type { Verse, ExerciseResult, BibleData } from '../lib/types';
import MissingWords from '../components/memorize/MissingWords';
import Progressive from '../components/memorize/Progressive';
import Recitation from '../components/memorize/Recitation';
import FirstLetters from '../components/memorize/FirstLetters';
import WordOrder from '../components/memorize/WordOrder';

type TabKey = ExerciseResult['type'];

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'progressive', label: 'Progressive', icon: <Layers className="w-4 h-4" /> },
  { key: 'missing-words', label: 'Missing Words', icon: <Puzzle className="w-4 h-4" /> },
  { key: 'first-letters', label: 'First Letters', icon: <CaseSensitive className="w-4 h-4" /> },
  { key: 'word-order', label: 'Word Order', icon: <Shuffle className="w-4 h-4" /> },
  { key: 'recitation', label: 'Full Recitation', icon: <AlignLeft className="w-4 h-4" /> },
];

export default function MemorizePage() {
  const [searchParams] = useSearchParams();
  const { recordExercise } = useProgress();

  const paramBook = searchParams.get('book');
  const paramChapter = searchParams.get('chapter');
  const paramStart = searchParams.get('start');
  const paramEnd = searchParams.get('end');

  const [selectedBook, setSelectedBook] = useState<string>(paramBook ?? '');
  const [bookData, setBookData] = useState<BibleData | null>(null);
  const [bookLoading, setBookLoading] = useState(false);

  const [selectedChapter, setSelectedChapter] = useState<number>(
    paramChapter ? Number(paramChapter) : 0,
  );
  const [startVerse, setStartVerse] = useState<number>(
    paramStart ? Number(paramStart) : 1,
  );
  const [endVerse, setEndVerse] = useState<number>(
    paramEnd ? Number(paramEnd) : 1,
  );
  const [activeTab, setActiveTab] = useState<TabKey>('progressive');
  const [peeking, setPeeking] = useState(false);
  const [selectorCollapsed, setSelectorCollapsed] = useState(
    Boolean(paramBook && paramChapter),
  );

  const bookMeta = selectedBook ? getBookBySlug(selectedBook) : undefined;
  const bookName = bookMeta?.name ?? '';

  // Load book data when selection changes
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

  const allChapters = bookData?.chapters ?? [];
  const chapter = selectedChapter
    ? allChapters.find((c) => c.chapter === selectedChapter)
    : undefined;
  const maxVerse = chapter ? chapter.verses.length : 1;

  // Set defaults when chapter changes without URL params
  useEffect(() => {
    if (!paramStart && chapter) {
      setStartVerse(1);
      setEndVerse(Math.min(5, chapter.verses.length));
    }
  }, [selectedChapter, chapter, paramStart]);

  // Keep endVerse >= startVerse
  useEffect(() => {
    if (endVerse < startVerse) {
      setEndVerse(startVerse);
    }
  }, [startVerse, endVerse]);

  const verses: Verse[] = useMemo(() => {
    if (!chapter) return [];
    return chapter.verses.filter(
      (v) => v.verse >= startVerse && v.verse <= endVerse,
    );
  }, [chapter, startVerse, endVerse]);

  const passageText = useMemo(
    () => verses.map((v) => v.text).join(' '),
    [verses],
  );

  const passageSelected = selectedBook && selectedChapter > 0 && verses.length > 0;

  const XP_TABLE: Record<TabKey, number> = {
    'missing-words': 20,
    'first-letters': 35,
    'word-order': 25,
    progressive: 30,
    recitation: 50,
  };

  const handleComplete = useCallback(
    (accuracy: number) => {
      const result: ExerciseResult = {
        type: activeTab,
        book: selectedBook,
        chapterNumber: selectedChapter,
        startVerse,
        endVerse,
        accuracy,
        xpEarned: 0,
        timestamp: Date.now(),
        passageText: passageText.slice(0, 200),
      };
      recordExercise(result);

      const base = XP_TABLE[activeTab] ?? 0;
      const bonus = accuracy > 0.9 ? 10 : 0;
      const xp = base + bonus;
      const pct = Math.round(accuracy * 100);
      showToast(`+${xp} XP earned! (${pct}% accuracy)`, 'success');
    },
    [activeTab, selectedBook, selectedChapter, startVerse, endVerse, recordExercise],
  );

  const otBooks = getOldTestamentBooks();
  const ntBooks = getNewTestamentBooks();

  function handleBookChange(slug: string) {
    setSelectedBook(slug);
    setSelectedChapter(0);
    setStartVerse(1);
    setEndVerse(1);
  }

  return (
    <div className="py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-gold-500" />
        <h1 className="text-3xl font-serif font-bold text-cream">Memorise</h1>
      </div>

      {/* Passage Selector */}
      <section className="card space-y-4">
        {/* Collapsed state */}
        {passageSelected && selectorCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/50 text-xs">Currently you are practising</p>
                <p className="text-gold-400 font-serif font-semibold">
                  {formatReference(bookName, selectedChapter, startVerse, endVerse !== startVerse ? endVerse : undefined)}
                  <span className="text-cream/30 font-sans font-normal ml-2 text-sm">
                    ({verses.length} verse{verses.length > 1 ? 's' : ''})
                  </span>
                </p>
              </div>
              <button
              type="button"
              onClick={() => setSelectorCollapsed(false)}
              className="btn-outline text-sm inline-flex items-center gap-1.5"
            >
              Change passage
              <ChevronDown className="w-4 h-4" />
            </button>
            </div>
            <p
              className="text-cream/60 text-sm leading-relaxed line-clamp-3 font-serif transition-[filter] duration-200 select-none cursor-pointer"
              style={{ filter: peeking ? 'none' : 'blur(6px)' }}
              onPointerDown={() => setPeeking(true)}
              onPointerUp={() => setPeeking(false)}
              onPointerLeave={() => setPeeking(false)}
              title="Hold to peek"
            >
              {passageText}
            </p>
          </div>
        ) : (
          <>
            {/* Expanded header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-cream/50">Select a Passage</h2>
              {passageSelected && (
                <button
                  type="button"
                  onClick={() => setSelectorCollapsed(true)}
                  className="text-cream/30 hover:text-cream/60 text-xs inline-flex items-center gap-1 transition-colors"
                >
                  Collapse
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Book */}
          <div className="space-y-1.5">
            <label htmlFor="book-select" className="text-xs text-cream/40">
              Book
            </label>
            <select
              id="book-select"
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

          {/* Chapter */}
          <div className="space-y-1.5">
            <label htmlFor="chapter-select" className="text-xs text-cream/40">
              Chapter
            </label>
            <select
              id="chapter-select"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              disabled={!selectedBook || bookLoading}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
            >
              <option value={0}>Select chapter</option>
              {allChapters.map((ch) => (
                <option key={ch.chapter} value={ch.chapter}>
                  {bookName} {ch.chapter}
                </option>
              ))}
            </select>
          </div>

          {/* Start Verse */}
          <div className="space-y-1.5">
            <label htmlFor="start-verse" className="text-xs text-cream/40">
              Start Verse
            </label>
            <select
              id="start-verse"
              value={startVerse}
              onChange={(e) => setStartVerse(Number(e.target.value))}
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

          {/* End Verse */}
          <div className="space-y-1.5">
            <label htmlFor="end-verse" className="text-xs text-cream/40">
              End Verse
            </label>
            <select
              id="end-verse"
              value={endVerse}
              onChange={(e) => setEndVerse(Number(e.target.value))}
              disabled={!selectedChapter}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
            >
              {Array.from(
                { length: maxVerse - startVerse + 1 },
                (_, i) => startVerse + i,
              ).map((v) => (
                <option key={v} value={v}>
                  Verse {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {bookLoading && (
          <div className="flex items-center gap-2 text-cream/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading book data…
          </div>
        )}

        {/* Preview */}
        {passageSelected && (
          <div className="pt-2 border-t border-gold-500/10 space-y-3">
            <p className="text-gold-400 text-sm font-medium">
              {formatReference(bookName, selectedChapter, startVerse, endVerse !== startVerse ? endVerse : undefined)}
              <span className="text-cream/30 ml-2">
                ({verses.length} verse{verses.length > 1 ? 's' : ''})
              </span>
            </p>
            <p
              className="text-cream/60 text-sm leading-relaxed line-clamp-3 font-serif transition-[filter] duration-200 select-none cursor-pointer"
              style={{ filter: peeking ? 'none' : 'blur(6px)' }}
              onPointerDown={() => setPeeking(true)}
              onPointerUp={() => setPeeking(false)}
              onPointerLeave={() => setPeeking(false)}
              title="Hold to peek"
            >
              {passageText}
            </p>
          </div>
        )}
          </>
        )}
      </section>

      {/* Exercise Area */}
      {passageSelected && (
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gold-500 text-navy-900'
                      : 'bg-navy-800 border border-gold-500/10 hover:border-gold-500/30 hover:text-cream'
                  }`}
                >
                  <span className={isActive ? '' : 'text-gold-500'}>
                    {tab.icon}
                  </span>
                  <span className={isActive ? '' : 'text-cream/50'}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="card">
            {activeTab === 'missing-words' && (
              <MissingWords
                verses={verses}
                bookName={bookName}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
            {activeTab === 'first-letters' && (
              <FirstLetters
                verses={verses}
                bookName={bookName}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
            {activeTab === 'word-order' && (
              <WordOrder
                verses={verses}
                bookName={bookName}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
            {activeTab === 'progressive' && (
              <Progressive
                verses={verses}
                bookName={bookName}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
            {activeTab === 'recitation' && (
              <Recitation
                verses={verses}
                bookName={bookName}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
