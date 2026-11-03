import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, CheckCircle, Undo2 } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { wordsMatch } from '../../lib/word-compare';
import { getEncouragement } from '../../lib/encouragement';

type Difficulty = 'normal' | 'medium' | 'hard';

const DIFFICULTY_OPTIONS: { key: Difficulty; label: string; description: string }[] = [
  { key: 'normal', label: 'Normal', description: 'All words shown' },
  { key: 'medium', label: 'Medium', description: '15% of words removed — type them in' },
  { key: 'hard', label: 'Hard', description: '35% of words removed — type them in' },
];

interface WordEntry {
  word: string;
  globalIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function WordOrder({
  verses,
  bookName,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [attempt, setAttempt] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [typedWords, setTypedWords] = useState<Record<number, string>>({});

  const words: WordEntry[] = useMemo(() => {
    let idx = 0;
    return verses.flatMap((v) => {
      const tokens = v.text.split(/\s+/).filter((t) => t.length > 0);
      return tokens.map((word) => ({
        word,
        globalIndex: idx++,
      }));
    });
  }, [verses]);

  const totalWords = words.length;


  // In medium/hard mode, some words are removed from the word bank
  const removedIndices = useMemo(() => {
    if (difficulty === 'normal') return new Set<number>();
    const percent = difficulty === 'medium' ? 0.15 : 0.35;
    const count = Math.max(1, Math.round(totalWords * percent));
    const indices = shuffle(Array.from({ length: totalWords }, (_, i) => i));
    return new Set(indices.slice(0, count));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, totalWords, attempt]);

  // Scrambled order for the word bank
  const scrambledOrder = useMemo(() => {
    const available = words
      .filter((w) => !removedIndices.has(w.globalIndex))
      .map((w) => w.globalIndex);
    return shuffle(available);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, removedIndices, attempt]);

  // Which words from the bank have not been placed yet
  const remainingBank = scrambledOrder.filter((i) => !placed.includes(i));

  const handlePlace = useCallback((index: number) => {
    if (checked) return;
    setPlaced((prev) => [...prev, index]);
  }, [checked]);

  const handleRemoveLast = useCallback(() => {
    if (checked) return;
    setPlaced((prev) => prev.slice(0, -1));
  }, [checked]);

  const handleRemoveWord = useCallback((position: number) => {
    if (checked) return;
    setPlaced((prev) => prev.filter((_, i) => i !== position));
  }, [checked]);

  const handleCheck = useCallback(() => {
    let correct = 0;

    // Simple approach: the user's placed order should match the original order
    // In advanced mode, removed words need to be typed in between
    if (difficulty === 'normal') {
      for (let i = 0; i < placed.length; i++) {
        if (
          i < words.length &&
          wordsMatch(words[placed[i]].word, words[i].word)
        ) {
          correct++;
        }
      }
    } else {
      // Advanced: merge placed words and typed words into the answer
      let pIdx = 0;
      for (let i = 0; i < words.length; i++) {
        let ans: string;
        if (removedIndices.has(i)) {
          ans = typedWords[i] ?? '';
        } else {
          ans = pIdx < placed.length ? words[placed[pIdx]].word : '';
          pIdx++;
        }
        if (wordsMatch(ans, words[i].word)) {
          correct++;
        }
      }
    }

    const acc = totalWords > 0 ? correct / totalWords : 1;
    setAccuracy(acc);
    setChecked(true);
    onComplete(acc);
  }, [words, placed, typedWords, difficulty, removedIndices, totalWords, onComplete]);

  const handleTryAgain = useCallback(() => {
    setAttempt((a) => a + 1);
    setPlaced([]);
    setChecked(false);
    setAccuracy(null);
    setTypedWords({});
  }, []);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setAttempt((a) => a + 1);
    setPlaced([]);
    setChecked(false);
    setAccuracy(null);
    setTypedWords({});
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
            Word Ordering
          </h3>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            placed.length === scrambledOrder.length
              ? 'text-gold-400 bg-gold-500/15'
              : 'text-cream/30 bg-navy-700'
          }`}
        >
          {placed.length}/{scrambledOrder.length} placed
        </span>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <p className="text-xs text-cream/40">Choose difficulty</p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleDifficultyChange(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                difficulty === opt.key
                  ? 'bg-gold-500 text-navy-900'
                  : 'bg-navy-800 border border-gold-500/10 text-cream/50 hover:border-gold-500/30 hover:text-cream'
              }`}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Built sentence area */}
      <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-4 min-h-[4rem]">
        <p className="text-cream/30 text-xs mb-2">Your sentence:</p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {difficulty === 'normal' ? (
            <>
              {placed.map((wordIdx, pos) => {
                const entry = words[wordIdx];
                const isCorrectPos =
                  checked &&
                  pos < words.length &&
                  wordsMatch(entry.word, words[pos].word);
                const isWrongPos = checked && !isCorrectPos;

                return (
                  <button
                    key={`${pos}-${wordIdx}`}
                    type="button"
                    onClick={() => handleRemoveWord(pos)}
                    disabled={checked}
                    className={`px-2.5 py-1 rounded-lg text-sm font-serif transition-colors ${
                      isCorrectPos
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : isWrongPos
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-gold-500/15 text-cream border border-gold-500/30 hover:bg-gold-500/25 cursor-pointer'
                    }`}
                  >
                    {entry.word}
                  </button>
                );
              })}
              {placed.length === 0 && !checked && (
                <span className="text-cream/20 text-sm italic">
                  Click words below to build the sentence...
                </span>
              )}
            </>
          ) : (
            /* Advanced mode: show placed words with gaps for removed words */
            (() => {
              const elements: React.ReactNode[] = [];
              let pIdx = 0;

              for (let i = 0; i < words.length; i++) {
                if (removedIndices.has(i)) {
                  // Typed input for removed word
                  const typed = typedWords[i] ?? '';
                  const isCorrect =
                    checked &&
                    wordsMatch(typed, words[i].word);
                  const isEmpty = checked && typed.trim().length === 0;
                  const isWrong = checked && !isCorrect && !isEmpty;

                  elements.push(
                    <span key={`typed-${i}`} className="inline-flex items-center gap-0.5">
                      <input
                        type="text"
                        value={typed}
                        onChange={(e) =>
                          setTypedWords((prev) => ({
                            ...prev,
                            [i]: e.target.value,
                          }))
                        }
                        disabled={checked}
                        className={[
                          'text-center text-sm font-serif px-1.5 py-1 rounded border w-20',
                          'focus:outline-none focus:ring-1 transition-colors',
                          isCorrect
                            ? 'border-green-500/60 text-green-400 bg-green-500/10'
                            : isEmpty
                              ? 'border-yellow-500/60 text-yellow-400 bg-yellow-500/10'
                              : isWrong
                                ? 'border-red-500/60 text-red-400 bg-red-500/10'
                              : 'border-gold-500/40 bg-navy-600/50 text-cream placeholder:text-cream/30 focus:ring-gold-500/30',
                        ].join(' ')}
                        placeholder="type word"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {checked && isWrong && typed.trim().length === 0 && (
                        <span className="text-gold-400 text-xs font-sans">
                          {words[i].word}
                        </span>
                      )}
                      {checked && isWrong && typed.trim().length > 0 && (
                        <span className="text-gold-400 text-xs font-sans">
                          {words[i].word}
                        </span>
                      )}
                    </span>,
                  );
                } else {
                  // Placed word from bank
                  if (pIdx < placed.length) {
                    const wordIdx = placed[pIdx];
                    const entry = words[wordIdx];
                    const isCorrectPos =
                      checked &&
                      wordsMatch(entry.word, words[i].word);
                    const isWrongPos = checked && !isCorrectPos;

                    elements.push(
                      <button
                        key={`placed-${i}-${pIdx}`}
                        type="button"
                        onClick={() => handleRemoveWord(pIdx)}
                        disabled={checked}
                        className={`px-2.5 py-1 rounded-lg text-sm font-serif transition-colors ${
                          isCorrectPos
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : isWrongPos
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-gold-500/15 text-cream border border-gold-500/30 hover:bg-gold-500/25 cursor-pointer'
                        }`}
                      >
                        {entry.word}
                      </button>,
                    );
                    pIdx++;
                  } else if (!checked) {
                    elements.push(
                      <span
                        key={`empty-${i}`}
                        className="px-2.5 py-1 rounded-lg text-sm border border-dashed border-cream/10 text-cream/15"
                      >
                        ···
                      </span>,
                    );
                  }
                }
              }
              return <>{elements}</>;
            })()
          )}
        </div>
      </div>

      {/* Word bank */}
      {!checked && remainingBank.length > 0 && (
        <div className="space-y-2">
          <p className="text-cream/30 text-xs">Word bank:</p>
          <div className="flex flex-wrap gap-2">
            {remainingBank.map((wordIdx) => {
              const entry = words[wordIdx];
              return (
                <button
                  key={wordIdx}
                  type="button"
                  onClick={() => handlePlace(wordIdx)}
                  className="px-3 py-1.5 rounded-lg text-sm font-serif bg-navy-800 border border-gold-500/10 text-cream/70 hover:border-gold-500/30 hover:text-cream transition-colors cursor-pointer"
                >
                  {entry.word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Accuracy bar */}
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

      {/* Correct passage after check */}
      {checked && (
        <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-4">
          <p className="text-cream/50 text-xs font-medium mb-2">Correct order:</p>
          <p className="text-cream/80 font-serif leading-relaxed">
            {words.map((w) => w.word).join(' ')}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {!checked && (
          <>
            <button
              type="button"
              onClick={handleCheck}
              disabled={
                difficulty === 'normal'
                  ? placed.length !== scrambledOrder.length
                  : placed.length !== scrambledOrder.length
              }
              className="btn-gold text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Check Answer
            </button>
            {placed.length > 0 && (
              <button
                type="button"
                onClick={handleRemoveLast}
                className="btn-outline text-sm inline-flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </button>
            )}
          </>
        )}

        {checked && (
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
