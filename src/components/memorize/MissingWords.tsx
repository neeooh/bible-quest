import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, ChevronRight, Eye, CheckCircle } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { normalizeWord, getRandomIndices } from '../../lib/word-compare';
import { formatReference } from '../../lib/bible';

interface WordEntry {
  word: string;
  verseNum: number;
  globalIndex: number;
  isFirstInVerse: boolean;
}

export default function MissingWords({
  verses,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const [round, setRound] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());

  /* ---- build a flat word list from all verses -------------------- */
  const words: WordEntry[] = useMemo(() => {
    let idx = 0;
    return verses.flatMap((v) => {
      const tokens = v.text.split(/\s+/).filter((t) => t.length > 0);
      return tokens.map((word, i) => ({
        word,
        verseNum: v.verse,
        globalIndex: idx++,
        isFirstInVerse: i === 0,
      }));
    });
  }, [verses]);

  const totalWords = words.length;

  /* ---- hide percentage: 30 % base + 15 % per round, max 95 % ---- */
  const hidePercent = Math.min(0.3 + (round - 1) * 0.15, 0.95);
  const hideCount = Math.max(1, Math.round(totalWords * hidePercent));

  /* ---- stable random indices that change per round --------------- */
  const hiddenSet = useMemo(() => {
    return new Set(getRandomIndices(totalWords, hideCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, totalWords, hideCount]);

  const reference = formatReference(
    chapter,
    startVerse,
    startVerse !== endVerse ? endVerse : undefined,
  );

  /* ---- handlers -------------------------------------------------- */
  const handleChange = useCallback((index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }, []);

  const handleCheck = useCallback(() => {
    let correct = 0;
    let total = 0;
    const newWrong = new Set(wrongIndices);

    for (const entry of words) {
      if (!hiddenSet.has(entry.globalIndex)) continue;
      total++;
      const answer = answers[entry.globalIndex] ?? '';
      if (normalizeWord(answer) === normalizeWord(entry.word)) {
        correct++;
      } else {
        newWrong.add(entry.globalIndex);
      }
    }

    const acc = total > 0 ? correct / total : 1;
    setAccuracy(acc);
    setChecked(true);
    setWrongIndices(newWrong);
    onComplete(acc);
  }, [words, hiddenSet, answers, wrongIndices, onComplete]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    const filled: Record<number, string> = {};
    for (const entry of words) {
      if (hiddenSet.has(entry.globalIndex)) {
        // Strip trailing punctuation so the reveal looks clean in the input.
        filled[entry.globalIndex] = entry.word.replace(/[.,;:!?"'()]+$/, '');
      }
    }
    setAnswers(filled);
  }, [words, hiddenSet]);

  const handleTryAgain = useCallback(() => {
    setAnswers({});
    setChecked(false);
    setRevealed(false);
    setAccuracy(null);
  }, []);

  const handleNextRound = useCallback(() => {
    setRound((r) => r + 1);
    setAnswers({});
    setChecked(false);
    setRevealed(false);
    setAccuracy(null);
  }, []);

  /* ---- derived display values ------------------------------------ */
  const accuracyColor =
    accuracy !== null
      ? accuracy > 0.8
        ? 'text-green-400'
        : accuracy > 0.6
          ? 'text-yellow-400'
          : 'text-red-400'
      : '';

  const accuracyBg =
    accuracy !== null
      ? accuracy > 0.8
        ? 'bg-green-500'
        : accuracy > 0.6
          ? 'bg-yellow-500'
          : 'bg-red-500'
      : '';

  const canAdvance = hidePercent < 0.95;

  return (
    <div className="space-y-6">
      {/* ---- header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif font-semibold text-cream">
            Missing Words
          </h3>
          <p className="text-cream/40 text-sm">
            {reference} · Round {round} ·{' '}
            {Math.round(hidePercent * 100)}% hidden
          </p>
        </div>
        <span className="text-xs text-cream/30 bg-navy-700 px-3 py-1 rounded-full">
          {hiddenSet.size} blank{hiddenSet.size !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ---- passage with inline inputs ---- */}
      <div className="leading-[2.6] text-cream/90 font-serif text-lg select-none">
        {words.map((entry) => {
          const isHidden = hiddenSet.has(entry.globalIndex);
          const answer = answers[entry.globalIndex] ?? '';
          const normAnswer = normalizeWord(answer);
          const normExpected = normalizeWord(entry.word);
          const isCorrect = normAnswer.length > 0 && normAnswer === normExpected;
          const isWrong = normAnswer.length > 0 && normAnswer !== normExpected;

          return (
            <span key={entry.globalIndex}>
              {/* verse superscript */}
              {entry.isFirstInVerse && (
                <sup className="text-gold-500 text-xs font-sans font-bold mr-0.5 select-none">
                  {entry.verseNum}
                </sup>
              )}

              {isHidden ? (
                <span className="inline-flex items-center mx-0.5 align-baseline gap-0.5">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) =>
                      handleChange(entry.globalIndex, e.target.value)
                    }
                    disabled={checked || revealed}
                    className={[
                      'text-center text-base font-serif px-1 py-0.5 rounded border',
                      'bg-navy-700 focus:outline-none focus:ring-1 transition-colors',
                      checked || revealed
                        ? isCorrect
                          ? 'border-green-500/60 text-green-400 bg-green-500/10'
                          : 'border-red-500/60 text-red-400 bg-red-500/10'
                        : isCorrect
                          ? 'border-green-500/60 text-green-400 focus:ring-green-500/40'
                          : isWrong
                            ? 'border-red-500/40 text-cream focus:ring-red-500/30'
                            : 'border-gold-500/30 text-cream focus:ring-gold-500/30',
                    ].join(' ')}
                    style={{
                      width: `${Math.max(entry.word.length + 2, 4)}ch`,
                    }}
                    placeholder="···"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {/* show correct word next to wrong answers after check */}
                  {checked && !isCorrect && (
                    <span className="text-gold-400 text-xs font-sans whitespace-nowrap">
                      {entry.word}
                    </span>
                  )}
                </span>
              ) : (
                <span className="select-text">{entry.word}</span>
              )}{' '}
            </span>
          );
        })}
      </div>

      {/* ---- accuracy bar ---- */}
      {accuracy !== null && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${accuracyBg}`}
                style={{ width: `${Math.round(accuracy * 100)}%` }}
              />
            </div>
            <span className={`text-lg font-bold font-serif ${accuracyColor}`}>
              {Math.round(accuracy * 100)}%
            </span>
          </div>
          {wrongIndices.size > 0 && (
            <p className="text-cream/30 text-xs">
              {wrongIndices.size} word{wrongIndices.size !== 1 ? 's' : ''}{' '}
              marked for practice across all rounds.
            </p>
          )}
        </div>
      )}

      {/* ---- revealed notice ---- */}
      {revealed && !checked && (
        <p className="text-cream/40 text-sm italic">
          Answers revealed. Use Try Again to test yourself, or advance to the
          next round.
        </p>
      )}

      {/* ---- action buttons ---- */}
      <div className="flex flex-wrap gap-3">
        {!checked && !revealed && (
          <>
            <button
              type="button"
              onClick={handleCheck}
              className="btn-gold text-sm inline-flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Check Answers
            </button>
            <button
              type="button"
              onClick={handleReveal}
              className="btn-outline text-sm inline-flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Reveal Answers
            </button>
          </>
        )}

        {(checked || revealed) && (
          <>
            <button
              type="button"
              onClick={handleTryAgain}
              className="btn-outline text-sm inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            {canAdvance && (
              <button
                type="button"
                onClick={handleNextRound}
                className="btn-gold text-sm inline-flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Next Round
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
