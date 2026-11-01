import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Minus, Plus, BookOpen } from 'lucide-react';
import { getChapter, bibleData } from '../lib/bible';

export default function ReadPage() {
  const { chapter: chapterParam } = useParams<{ chapter: string }>();
  const navigate = useNavigate();
  const num = Number(chapterParam) || 1;
  const chapter = getChapter(num);
  const total = bibleData.chapters.length;

  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());

  const { startV, endV } = useMemo(() => {
    if (selectedVerses.size === 0) return { startV: 0, endV: 0 };
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    return { startV: sorted[0], endV: sorted[sorted.length - 1] };
  }, [selectedVerses]);

  if (!chapter) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-cream/50 text-lg">Chapter not found.</p>
        <Link to="/library" className="btn-outline inline-block">
          Back to Library
        </Link>
      </div>
    );
  }

  function toggleVerse(verseNum: number) {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) {
        next.delete(verseNum);
      } else {
        next.add(verseNum);
      }
      return next;
    });
  }

  function decreaseFont() {
    setFontSize(prev => Math.max(14, prev - 2));
  }

  function increaseFont() {
    setFontSize(prev => Math.min(28, prev + 2));
  }

  return (
    <div className="py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/library"
            className="text-cream/40 hover:text-cream transition-colors"
            aria-label="Back to library"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-cream">
            Matthew {num}
          </h1>
        </div>

        {/* Font size controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decreaseFont}
            className="w-8 h-8 rounded-lg border border-gold-500/20 text-cream/50 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
            aria-label="Decrease font size"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-cream/30 text-xs w-8 text-center">{fontSize}</span>
          <button
            type="button"
            onClick={increaseFont}
            className="w-8 h-8 rounded-lg border border-gold-500/20 text-cream/50 hover:text-cream hover:border-gold-500/40 transition-colors flex items-center justify-center"
            aria-label="Increase font size"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selection hint */}
      <p className="text-cream/30 text-xs">
        Tap any verse to select it for memorization.
      </p>

      {/* Verses */}
      <div
        className="space-y-1 leading-relaxed"
        style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
      >
        {chapter.verses.map(v => {
          const isSelected = selectedVerses.has(v.verse);
          return (
            <span
              key={v.verse}
              role="button"
              tabIndex={0}
              onClick={() => toggleVerse(v.verse)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleVerse(v.verse);
                }
              }}
              className={`inline cursor-pointer rounded px-0.5 -mx-0.5 transition-colors ${
                isSelected
                  ? 'bg-gold-500/20 text-cream'
                  : 'hover:bg-navy-700'
              }`}
            >
              <sup className="verse-number">{v.verse}</sup>
              <span className="verse-text">{v.text} </span>
            </span>
          );
        })}
      </div>

      {/* Chapter navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-gold-500/10">
        {num > 1 ? (
          <button
            type="button"
            onClick={() => {
              setSelectedVerses(new Set());
              navigate(`/read/${num - 1}`);
            }}
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
            onClick={() => {
              setSelectedVerses(new Set());
              navigate(`/read/${num + 1}`);
            }}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Link
            to={`/memorize?chapter=${num}&start=${startV}&end=${endV}`}
            className="btn-gold inline-flex items-center gap-2 shadow-lg shadow-navy-900/50 text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Memorize Selected ({selectedVerses.size} verse{selectedVerses.size > 1 ? 's' : ''})
          </Link>
        </div>
      )}
    </div>
  );
}
