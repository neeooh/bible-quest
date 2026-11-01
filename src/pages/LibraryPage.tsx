import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Check } from 'lucide-react';
import { bibleData, getChapter } from '../lib/bible';
import { useProgress } from '../hooks/useProgress';

export default function LibraryPage() {
  const chapters = bibleData.chapters;
  const { progress } = useProgress();
  const navigate = useNavigate();

  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);

  const chapter = selectedChapter ? getChapter(selectedChapter) : undefined;
  const maxVerse = chapter ? chapter.verses.length : 1;

  function handleChapterChange(num: number) {
    setSelectedChapter(num);
    setSelectedVerse(1);
  }

  function handleGo() {
    if (!selectedChapter) return;
    navigate(`/read/${selectedChapter}?verse=${selectedVerse}`);
  }

  return (
    <div className="py-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">Gospel of Matthew</h1>
        </div>
        <p className="text-cream/40 text-sm">
          {chapters.length} chapters &middot; World English Bible
        </p>
      </div>

      {/* Passage Selector Card */}
      <section className="card space-y-4">
        <h2 className="text-sm font-medium text-cream/50">Go to a Passage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label htmlFor="lib-chapter" className="text-xs text-cream/40">Chapter</label>
            <select
              id="lib-chapter"
              value={selectedChapter}
              onChange={e => handleChapterChange(Number(e.target.value))}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50"
            >
              <option value={0}>Select chapter</option>
              {chapters.map(ch => (
                <option key={ch.chapter} value={ch.chapter}>
                  Matthew {ch.chapter}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lib-verse" className="text-xs text-cream/40">Verse</label>
            <select
              id="lib-verse"
              value={selectedVerse}
              onChange={e => setSelectedVerse(Number(e.target.value))}
              disabled={!selectedChapter}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
            >
              {Array.from({ length: maxVerse }, (_, i) => i + 1).map(v => (
                <option key={v} value={v}>Verse {v}</option>
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
        {chapters.map(ch => {
          const cardPreview = ch.verses
            .slice(0, 2)
            .map(v => v.text)
            .join(' ')
            .slice(0, 80);

          const isExplored = progress.chaptersExplored.includes(ch.chapter);

          return (
            <Link
              key={ch.chapter}
              to={`/read/${ch.chapter}`}
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
