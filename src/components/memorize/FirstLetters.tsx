import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, CheckCircle, Eye, Lightbulb } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { normalizeWord } from '../../lib/word-compare';
import { formatReference } from '../../lib/bible';

interface WordEntry {
  word: string;
  verseNum: number;
  globalIndex: number;
  isFirstInVerse: boolean;
  firstLetter: string;
}

function getFirstLetter(word: string): string {
  const match = word.match(/[a-zA-Z]/);
  return match ? match[0] : word[0] ?? '';
}

export default function FirstLetters({
  verses,
  bookName,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [hints, setHints] = useState<Set<number>>(new Set());

  const words: WordEntry[] = useMemo(() => {
    let idx = 0;
    return verses.flatMap((v) => {
      const tokens = v.text.split(/\s+/).filter((t) => t.length > 0);
      return tokens.map((word, i) => ({
        word,
        verseNum: v.verse,
        globalIndex: idx++,
        isFirstInVerse: i === 0,
        firstLetter: getFirstLetter(word),
      }));
    });
  }, [verses]);

  const reference = formatReference(
    bookName,
    chapter,
    startVerse,
    startVerse !== endVerse ? endVerse : undefined,
  );

  const sortedIndices = useMemo(
    () => words.map((w) => w.globalIndex),
    [words],
  );

  const filledCount = words.filter(
    (w) => (answers[w.globalIndex] ?? '').trim().length > 0,
  ).length;

  // First-letter display text
  const hintText = useMemo(() => {
    const parts: string[] = [];
    for (const w of words) {
      if (w.isFirstInVerse && parts.length > 0) {
        parts.push(' ');
      }
      const leading = w.word.match(/^[^a-zA-Z]*/)?.[0] ?? '';
      const trailing = w.word.match(/[^a-zA-Z]*$/)?.[0] ?? '';
      parts.push(`${leading}${w.firstLetter}${trailing}`);
      parts.push(' ');
    }
    return parts.join('').trim();
  }, [words]);

  const handleChange = useCallback((index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, globalIndex: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const currentPos = sortedIndices.indexOf(globalIndex);
        if (currentPos < sortedIndices.length - 1) {
          const nextIndex = sortedIndices[currentPos + 1];
          const nextInput = document.querySelector<HTMLInputElement>(
            `[data-fl-index="${nextIndex}"]`,
          );
          nextInput?.focus();
        }
      }
    },
    [sortedIndices],
  );

  const handleHint = useCallback((entry: WordEntry) => {
    const cleanWord = entry.word.replace(/[.,;:!?"'\u2018\u2019()]+$/, '');
    setAnswers((prev) => ({ ...prev, [entry.globalIndex]: cleanWord }));
    setHints((prev) => new Set(prev).add(entry.globalIndex));
  }, []);

  const handleCheck = useCallback(() => {
    let correct = 0;
    let total = words.length;

    for (const entry of words) {
      if (hints.has(entry.globalIndex)) continue;
      const answer = answers[entry.globalIndex] ?? '';
      if (normalizeWord(answer) === normalizeWord(entry.word)) {
        correct++;
      }
    }

    const acc = total > 0 ? correct / total : 1;
    setAccuracy(acc);
    setChecked(true);
    onComplete(acc);
  }, [words, answers, hints, onComplete]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    const filled: Record<number, string> = {};
    for (const entry of words) {
      filled[entry.globalIndex] = entry.word.replace(/[.,;:!?"'\u2018\u2019()]+$/, '');
    }
    setAnswers(filled);
  }, [words]);

  const handleTryAgain = useCallback(() => {
    setAnswers({});
    setChecked(false);
    setRevealed(false);
    setAccuracy(null);
    setHints(new Set());
  }, []);

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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif font-semibold text-cream">
            First Letters
          </h3>
          <p className="text-cream/40 text-sm">{reference}</p>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            filledCount === words.length
              ? 'text-gold-400 bg-gold-500/15'
              : 'text-cream/30 bg-navy-700'
          }`}
        >
          {filledCount}/{words.length} filled
        </span>
      </div>

      {/* First-letter hint display */}
      <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-5">
        <p className="font-serif text-xl leading-relaxed text-gold-400 tracking-wide">
          {hintText}
        </p>
      </div>

      {/* Inline word inputs */}
      <div className="leading-[2.6] text-cream/90 font-serif text-lg select-none">
        {words.map((entry) => {
          const answer = answers[entry.globalIndex] ?? '';
          const normAnswer = normalizeWord(answer);
          const normExpected = normalizeWord(entry.word);
          const isCorrect = normAnswer.length > 0 && normAnswer === normExpected;
          const isWrong = normAnswer.length > 0 && normAnswer !== normExpected;
          const isHinted = hints.has(entry.globalIndex);

          return (
            <span key={entry.globalIndex}>
              {entry.isFirstInVerse && (
                <sup className="text-gold-500 text-xs font-sans font-bold mr-0.5 select-none">
                  {entry.verseNum}
                </sup>
              )}
              <span className="inline-flex items-center mx-0.5 align-baseline gap-0.5">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => handleChange(entry.globalIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, entry.globalIndex)}
                  disabled={checked || revealed || isHinted}
                  data-fl-index={entry.globalIndex}
                  className={[
                    'text-center text-base font-serif px-1 py-0.5 rounded border',
                    'focus:outline-none focus:ring-1 transition-colors',
                    checked || revealed
                      ? isCorrect || isHinted
                        ? 'border-green-500/60 text-green-400 bg-green-500/10'
                        : 'border-red-500/60 text-red-400 bg-red-500/10'
                      : isHinted
                        ? 'border-gold-500/40 text-gold-400 bg-gold-500/10'
                        : isCorrect
                          ? 'border-green-500/60 text-green-400 bg-navy-700 focus:ring-green-500/40'
                          : isWrong
                            ? 'border-red-500/40 text-cream bg-navy-700 focus:ring-red-500/30'
                            : 'border-gold-500/40 bg-navy-600/50 text-cream placeholder:text-gold-500/50 focus:ring-gold-500/30',
                  ].join(' ')}
                  style={{ width: `${Math.max(entry.word.length + 2, 4)}ch` }}
                  placeholder={entry.firstLetter}
                  autoComplete="off"
                  spellCheck={false}
                />
                {!checked && !revealed && !isHinted && !isCorrect && (
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
                {checked && !isCorrect && !isHinted && (
                  <span className="text-gold-400 text-xs font-sans whitespace-nowrap">
                    {entry.word}
                  </span>
                )}
              </span>{' '}
            </span>
          );
        })}
      </div>

      {/* Accuracy bar */}
      {accuracy !== null && (
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
      )}

      {/* Revealed notice */}
      {revealed && !checked && (
        <p className="text-cream/40 text-sm italic">
          Answers revealed. Press Try Again to test yourself.
        </p>
      )}

      {/* Action buttons */}
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
