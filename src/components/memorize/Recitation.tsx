import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Check, Eye, EyeOff } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { compareTexts, type CompareResult } from '../../lib/word-compare';
import { formatReference } from '../../lib/bible';

export default function Recitation({
  verses,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const fullText = useMemo(
    () => verses.map((v) => v.text).join(' '),
    [verses],
  );

  const reference = formatReference(
    chapter,
    startVerse,
    startVerse !== endVerse ? endVerse : undefined,
  );

  /* ---- handlers -------------------------------------------------- */
  const handleCheck = useCallback(() => {
    const cmp = compareTexts(fullText, userInput);
    setResult(cmp);
    onComplete(cmp.accuracy);
  }, [fullText, userInput, onComplete]);

  const handleReset = useCallback(() => {
    setUserInput('');
    setResult(null);
    setShowOriginal(false);
  }, []);

  /* ---- accuracy colours ----------------------------------------- */
  const accColor = result
    ? result.accuracy > 0.8
      ? 'text-green-400'
      : result.accuracy > 0.6
        ? 'text-yellow-400'
        : 'text-red-400'
    : '';

  const accBg = result
    ? result.accuracy > 0.8
      ? 'bg-green-500'
      : result.accuracy > 0.6
        ? 'bg-yellow-500'
        : 'bg-red-500'
    : '';

  return (
    <div className="space-y-6">
      {/* ---- header ---- */}
      <div>
        <h3 className="text-lg font-serif font-semibold text-cream">
          Full Recitation
        </h3>
        <p className="text-cream/40 text-sm">
          Type the passage from memory.
        </p>
      </div>

      {/* ---- reference card ---- */}
      <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-5 text-center">
        <p className="text-gold-400 font-serif text-xl font-semibold">
          {reference}
        </p>
        <p className="text-cream/20 text-sm mt-1">
          {verses.length} verse{verses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ---- peek toggle ---- */}
      <button
        type="button"
        onClick={() => setShowOriginal((v) => !v)}
        className="inline-flex items-center gap-2 text-sm text-cream/40 hover:text-cream/60 transition-colors"
      >
        {showOriginal ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {showOriginal ? 'Hide Original' : 'Peek at Original'}
      </button>

      {showOriginal && (
        <div className="bg-navy-700/30 border border-gold-500/10 rounded-lg p-4 animate-[fadeIn_200ms_ease-out]">
          <p className="text-cream/60 font-serif leading-relaxed text-sm">
            {fullText}
          </p>
        </div>
      )}

      {/* ---- input ---- */}
      {!result && (
        <div className="space-y-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={8}
            className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-4 py-3 text-cream font-serif text-base leading-relaxed focus:outline-none focus:border-gold-500/50 resize-none transition-colors"
            placeholder="Type the passage from memory..."
            autoFocus
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!userInput.trim()}
            className="btn-gold text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Check
          </button>
        </div>
      )}

      {/* ---- results ---- */}
      {result && (
        <div className="space-y-5">
          {/* accuracy bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${accBg}`}
                style={{ width: `${Math.round(result.accuracy * 100)}%` }}
              />
            </div>
            <span className={`text-2xl font-bold font-serif ${accColor}`}>
              {Math.round(result.accuracy * 100)}%
            </span>
          </div>

          {/* word-by-word breakdown */}
          <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-5">
            <p className="text-cream/40 text-xs font-medium mb-3">
              Word-by-word breakdown:
            </p>
            <div className="leading-relaxed font-serif text-lg">
              {result.words.map((w, i) => {
                let cls = '';
                let title = '';
                switch (w.status) {
                  case 'correct':
                    cls = 'text-green-400';
                    title = 'Correct';
                    break;
                  case 'incorrect':
                    cls =
                      'text-yellow-400 underline decoration-yellow-500/30 decoration-wavy';
                    title = 'Incorrect — you wrote a different word';
                    break;
                  case 'missing':
                    cls = 'text-red-400 line-through decoration-red-500/50';
                    title = 'Missing — not in your answer';
                    break;
                  case 'extra':
                    cls = 'text-cream/20 italic';
                    title = 'Extra — not in the original';
                    break;
                }
                return (
                  <span key={i} className={`${cls} mr-1`} title={title}>
                    {w.word}
                  </span>
                );
              })}
            </div>

            {/* legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-cream/40">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Correct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                Wrong word
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Missing
              </span>
            </div>
          </div>

          {/* try again */}
          <button
            type="button"
            onClick={handleReset}
            className="btn-outline text-sm inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
