import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Eye, CheckCircle, Lightbulb } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { normalizeWord, wordsMatch } from '../../lib/word-compare';
import { getEncouragement } from '../../lib/encouragement';

interface WordEntry {
  word: string;
  verseNum: number;
  globalIndex: number;
  isFirstInVerse: boolean;
}

const FILLER_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'but', 'or',
  'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'that', 'this', 'these', 'those', 'it', 'its',
  'he', 'his', 'him', 'she', 'her', 'they', 'them', 'their',
  'you', 'your', 'we', 'our', 'us', 'me', 'my', 'i',
  'with', 'from', 'by', 'at', 'on', 'as', 'so', 'if', 'when',
  'not', 'no', 'nor', 'have', 'has', 'had', 'will', 'shall',
  'do', 'did', 'does', 'may', 'might', 'can', 'could', 'would', 'should',
  'who', 'whom', 'which', 'what', 'where', 'how', 'why',
  'all', 'also', 'than', 'then', 'into', 'up', 'out', 'about',
]);

function shuffle(arr: number[]): number[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function MissingWords({
  verses,
  onComplete,
}: ExerciseProps) {
  const [hidePercent, setHidePercent] = useState(0.15);
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [hints, setHints] = useState<Set<number>>(new Set());

  const DIFFICULTY_LEVELS = [
    { label: 'Easy', percent: 0.15 },
    { label: 'Medium', percent: 0.35 },
    { label: 'Hard', percent: 0.60 },
  ] as const;

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
  const hideCount = Math.max(1, Math.round(totalWords * hidePercent));

  /* ---- hidden indices: prefer content words over fillers ---------- */
  const hiddenSet = useMemo(() => {
    const contentIndices: number[] = [];
    const fillerIndices: number[] = [];

    for (const entry of words) {
      const norm = normalizeWord(entry.word);
      if (FILLER_WORDS.has(norm)) {
        fillerIndices.push(entry.globalIndex);
      } else {
        contentIndices.push(entry.globalIndex);
      }
    }

    const picked = [
      ...shuffle(contentIndices).slice(0, hideCount),
      ...shuffle(fillerIndices).slice(0, Math.max(0, hideCount - contentIndices.length)),
    ];

    return new Set(picked.slice(0, hideCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, words, hideCount]);

  /* ---- sorted hidden indices for keyboard navigation ------------- */
  const sortedHiddenIndices = useMemo(
    () => Array.from(hiddenSet).sort((a, b) => a - b),
    [hiddenSet],
  );

  /* ---- live progress counter ------------------------------------- */
  const filledCount = Array.from(hiddenSet).filter(
    (i) => (answers[i] ?? '').trim().length > 0,
  ).length;
  const allFilled = filledCount === hiddenSet.size;

  /* ---- handlers -------------------------------------------------- */
  const handleChange = useCallback((index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, globalIndex: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const currentPos = sortedHiddenIndices.indexOf(globalIndex);
        if (currentPos < sortedHiddenIndices.length - 1) {
          const nextIndex = sortedHiddenIndices[currentPos + 1];
          const nextInput = document.querySelector<HTMLInputElement>(
            `[data-blank-index="${nextIndex}"]`,
          );
          nextInput?.focus();
        }
      }
    },
    [sortedHiddenIndices],
  );

  const handleCheck = useCallback(() => {
    let correct = 0;
    let total = 0;

    for (const entry of words) {
      if (!hiddenSet.has(entry.globalIndex)) continue;
      total++;
      if (hints.has(entry.globalIndex)) continue; // hinted words do not count as correct
      const answer = answers[entry.globalIndex] ?? '';
      if (wordsMatch(answer, entry.word)) {
        correct++;
      }
    }

    const acc = total > 0 ? correct / total : 1;
    setAccuracy(acc);
    setChecked(true);
    onComplete(acc);
  }, [words, hiddenSet, answers, hints, onComplete]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    const filled: Record<number, string> = {};
    for (const entry of words) {
      if (hiddenSet.has(entry.globalIndex)) {
        filled[entry.globalIndex] = entry.word.replace(/[.,;:!?"'\u2018\u2019()]+$/, '');
      }
    }
    setAnswers(filled);
  }, [words, hiddenSet]);

  const handleTryAgain = useCallback(() => {
    setAttempt((a) => a + 1);
    setAnswers({});
    setChecked(false);
    setRevealed(false);
    setAccuracy(null);
    setHints(new Set());
  }, []);

  const handleHint = useCallback(
    (entry: WordEntry) => {
      const cleanWord = entry.word.replace(/[.,;:!?"'\u2018\u2019()]+$/, '');
      setAnswers((prev) => ({ ...prev, [entry.globalIndex]: cleanWord }));
      setHints((prev) => new Set(prev).add(entry.globalIndex));
    },
    [],
  );

  const handleDifficultyChange = useCallback((percent: number) => {
    setHidePercent(percent);
    setAttempt((a) => a + 1);
    setAnswers({});
    setChecked(false);
    setRevealed(false);
    setAccuracy(null);
    setHints(new Set());
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

  return (
    <div className="space-y-6">
      {/* ---- header with difficulty selector ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif font-semibold text-cream">
            Missing Words
          </h3>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            allFilled
              ? 'text-gold-400 bg-gold-500/15'
              : 'text-cream/30 bg-navy-700'
          }`}
        >
          {filledCount}/{hiddenSet.size} filled
        </span>
      </div>

      {/* ---- difficulty buttons ---- */}
      <div className="space-y-2">
        <p className="text-xs text-cream/40">Choose difficulty</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.label}
            type="button"
            onClick={() => handleDifficultyChange(level.percent)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              hidePercent === level.percent
                ? 'bg-gold-500 text-navy-900'
                : 'bg-navy-800 border border-gold-500/10 text-cream/50 hover:border-gold-500/30 hover:text-cream'
            }`}
          >
            {level.label}
          </button>
        ))}
        </div>
      </div>

      {/* ---- passage with inline inputs ---- */}
      <div className="leading-[2.6] text-cream/90 font-serif text-lg select-none">
        {words.map((entry) => {
          const isHidden = hiddenSet.has(entry.globalIndex);
          const answer = answers[entry.globalIndex] ?? '';
          const normAnswer = normalizeWord(answer);
          const isCorrect = normAnswer.length > 0 && wordsMatch(answer, entry.word);
          const isWrong = normAnswer.length > 0 && !wordsMatch(answer, entry.word);

          return (
            <span key={entry.globalIndex}>
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
                    onKeyDown={(e) => handleKeyDown(e, entry.globalIndex)}
                    disabled={checked || revealed || hints.has(entry.globalIndex)}
                    data-blank-index={entry.globalIndex}
                    className={[
                      'text-center text-base font-serif px-1 py-0.5 rounded border',
                      'focus:outline-none focus:ring-1 transition-colors',
                      checked || revealed
                        ? isCorrect || hints.has(entry.globalIndex)
                          ? 'border-green-500/60 text-green-400 bg-green-500/10'
                          : 'border-red-500/60 text-red-400 bg-red-500/10'
                        : hints.has(entry.globalIndex)
                          ? 'border-gold-500/40 text-gold-400 bg-gold-500/10'
                          : isCorrect
                            ? 'border-green-500/60 text-green-400 bg-navy-700 focus:ring-green-500/40'
                            : isWrong
                              ? 'border-red-500/40 text-cream bg-navy-700 focus:ring-red-500/30'
                              : 'border-gold-500/40 bg-navy-600/50 text-cream placeholder:text-gold-500/50 focus:ring-gold-500/30',
                    ].join(' ')}
                    style={{
                      width: `${Math.max(entry.word.length + 2, 4)}ch`,
                    }}
                    placeholder="···"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {!checked && !revealed && !hints.has(entry.globalIndex) && !isCorrect && (
                    <button
                      type="button"
                      onClick={() => handleHint(entry)}
                      className="text-cream/20 hover:text-gold-400 transition-colors"
                      aria-label="Reveal this word"
                      title="Hint"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {checked && !isCorrect && !hints.has(entry.globalIndex) && (
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
          <p className="text-cream/50 text-sm">{getEncouragement(accuracy)}</p>
        </div>
      )}

      {/* ---- revealed notice ---- */}
      {revealed && !checked && (
        <p className="text-cream/40 text-sm italic">
          Answers revealed. Press Try Again to test yourself with new words.
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
          <button
            type="button"
            onClick={handleTryAgain}
            className="btn-outline text-sm inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
