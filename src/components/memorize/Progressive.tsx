import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, ChevronRight, BookOpen, CheckCircle, Lightbulb } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { normalizeWord, wordsMatch, compareTexts } from '../../lib/word-compare';
import { formatReference } from '../../lib/bible';
import { getEncouragement } from '../../lib/encouragement';

const PHASE_LABELS = ['Read', '25%', '50%', '75%', 'Full Recall'];
const PHASE_HIDE = [0, 0.25, 0.5, 0.75, 1.0];

interface WordEntry {
  word: string;
  verseNum: number;
  globalIndex: number;
  isFirstInVerse: boolean;
}

export default function Progressive({
  verses,
  bookName,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const [phase, setPhase] = useState(1);
  const [phaseChecked, setPhaseChecked] = useState(false);
  const [phaseAccuracy, setPhaseAccuracy] = useState<number | null>(null);

  // Inline input state for phases 2–4
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hints, setHints] = useState<Set<number>>(new Set());

  // Textarea state for phase 5
  const [userInput, setUserInput] = useState('');

  const fullText = useMemo(
    () => verses.map((v) => v.text).join(' '),
    [verses],
  );

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

  const reference = formatReference(
    bookName,
    chapter,
    startVerse,
    startVerse !== endVerse ? endVerse : undefined,
  );

  /* Pre-shuffle indices once — each phase hides a growing prefix. */
  const shuffled = useMemo(() => {
    const arr = Array.from({ length: totalWords }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [totalWords]);

  const hideCount = Math.round(totalWords * PHASE_HIDE[phase - 1]);
  const hiddenSet = useMemo(
    () => new Set(shuffled.slice(0, hideCount)),
    [shuffled, hideCount],
  );

  const sortedHiddenIndices = useMemo(
    () => Array.from(hiddenSet).sort((a, b) => a - b),
    [hiddenSet],
  );

  const filledCount = Array.from(hiddenSet).filter(
    (i) => (answers[i] ?? '').trim().length > 0,
  ).length;

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
            `[data-prog-index="${nextIndex}"]`,
          );
          nextInput?.focus();
        }
      }
    },
    [sortedHiddenIndices],
  );

  const handleHint = useCallback((entry: WordEntry) => {
    const cleanWord = entry.word.replace(/[.,;:!?"'\u2018\u2019()]+$/, '');
    setAnswers((prev) => ({ ...prev, [entry.globalIndex]: cleanWord }));
    setHints((prev) => new Set(prev).add(entry.globalIndex));
  }, []);

  const handleCheckInline = useCallback(() => {
    let correct = 0;
    let total = 0;

    for (const entry of words) {
      if (!hiddenSet.has(entry.globalIndex)) continue;
      total++;
      if (hints.has(entry.globalIndex)) continue;
      const answer = answers[entry.globalIndex] ?? '';
      if (wordsMatch(answer, entry.word)) {
        correct++;
      }
    }

    const acc = total > 0 ? correct / total : 1;
    setPhaseAccuracy(acc);
    setPhaseChecked(true);
    if (phase === 4) {
      // Phase 4 is the last inline phase — do not call onComplete yet
    }
  }, [words, hiddenSet, answers, hints, phase]);

  const handleCheckFull = useCallback(() => {
    const result = compareTexts(fullText, userInput);
    setPhaseAccuracy(result.accuracy);
    setPhaseChecked(true);
    onComplete(result.accuracy);
  }, [fullText, userInput, onComplete]);

  const handleContinue = useCallback(() => {
    setPhase((p) => Math.min(p + 1, 5));
    setAnswers({});
    setHints(new Set());
    setUserInput('');
    setPhaseChecked(false);
    setPhaseAccuracy(null);
  }, []);

  const handleRestart = useCallback(() => {
    setPhase(1);
    setAnswers({});
    setHints(new Set());
    setUserInput('');
    setPhaseChecked(false);
    setPhaseAccuracy(null);
  }, []);

  /* ---- accuracy colours ----------------------------------------- */
  const accColor =
    phaseAccuracy !== null
      ? phaseAccuracy > 0.8
        ? 'text-green-400'
        : phaseAccuracy > 0.6
          ? 'text-yellow-400'
          : 'text-red-400'
      : '';

  const accBg =
    phaseAccuracy !== null
      ? phaseAccuracy > 0.8
        ? 'bg-green-500'
        : phaseAccuracy > 0.6
          ? 'bg-yellow-500'
          : 'bg-red-500'
      : '';

  /* ---- stepper --------------------------------------------------- */
  const stepper = (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {PHASE_LABELS.map((label, i) => {
        const step = i + 1;
        const active = step === phase;
        const done = step < phase;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center min-w-[2rem]">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  active
                    ? 'bg-gold-500 text-navy-900 scale-110'
                    : done
                      ? 'bg-gold-500/30 text-gold-400'
                      : 'bg-navy-700 text-cream/30',
                ].join(' ')}
              >
                {done ? '✓' : step}
              </div>
              <span
                className={[
                  'text-[10px] mt-1 whitespace-nowrap transition-colors',
                  active
                    ? 'text-gold-400 font-medium'
                    : done
                      ? 'text-cream/40'
                      : 'text-cream/20',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < PHASE_LABELS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 -mt-4 transition-colors duration-300 ${
                  done ? 'bg-gold-500/40' : 'bg-navy-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const accuracyBar =
    phaseAccuracy !== null ? (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-navy-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${accBg}`}
              style={{ width: `${Math.round(phaseAccuracy * 100)}%` }}
            />
          </div>
          <span className={`text-lg font-bold font-serif ${accColor}`}>
            {Math.round(phaseAccuracy * 100)}%
          </span>
        </div>
        <p className="text-cream/50 text-sm">{getEncouragement(phaseAccuracy)}</p>
      </div>
    ) : null;

  /* ---- inline passage with blanks (phases 2–4) ------------------ */
  const inlinePassage = (
    <div className="leading-[2.6] text-cream/90 font-serif text-lg select-none">
      {words.map((entry) => {
        const isHidden = hiddenSet.has(entry.globalIndex);
        const answer = answers[entry.globalIndex] ?? '';
        const normAnswer = normalizeWord(answer);
        const isCorrect = normAnswer.length > 0 && wordsMatch(answer, entry.word);
        const isWrong = normAnswer.length > 0 && !wordsMatch(answer, entry.word);
        const isHinted = hints.has(entry.globalIndex);

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
                  onChange={(e) => handleChange(entry.globalIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, entry.globalIndex)}
                  disabled={phaseChecked || isHinted}
                  data-prog-index={entry.globalIndex}
                  className={[
                    'text-center text-base font-serif px-1 py-0.5 rounded border',
                    'focus:outline-none focus:ring-1 transition-colors',
                    phaseChecked
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
                  placeholder="···"
                  autoComplete="off"
                  spellCheck={false}
                />
                {!phaseChecked && !isHinted && !isCorrect && (
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
                {phaseChecked && !isCorrect && !isHinted && (
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
  );

  return (
    <div className="space-y-6">
      {/* ---- header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif font-semibold text-cream">
            Progressive Recall
          </h3>
        </div>
        {phase >= 2 && phase <= 4 && (
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              filledCount === hiddenSet.size
                ? 'text-gold-400 bg-gold-500/15'
                : 'text-cream/30 bg-navy-700'
            }`}
          >
            {filledCount}/{hiddenSet.size} filled
          </span>
        )}
      </div>

      {stepper}

      {/* ---- phase 1: read ---- */}
      {phase === 1 && (
        <div className="space-y-4">
          <p className="text-cream/50 text-sm">
            Read the passage carefully. Press Ready when you feel prepared.
          </p>
          <div className="leading-[2.6] font-serif text-lg text-cream/90">
            {words.map((entry) => (
              <span key={entry.globalIndex}>
                {entry.isFirstInVerse && (
                  <sup className="text-gold-500 text-xs font-sans font-bold mr-0.5 select-none">
                    {entry.verseNum}
                  </sup>
                )}
                <span>{entry.word}</span>{' '}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="btn-gold text-sm inline-flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Ready
          </button>
        </div>
      )}

      {/* ---- phases 2–4: inline fill-in ---- */}
      {phase >= 2 && phase <= 4 && (
        <div className="space-y-4">
          <p className="text-cream/50 text-sm">
            {Math.round(PHASE_HIDE[phase - 1] * 100)}% of the words are hidden.
            Fill in the missing words.
          </p>

          {inlinePassage}

          {!phaseChecked && (
            <button
              type="button"
              onClick={handleCheckInline}
              className="btn-gold text-sm inline-flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Check
            </button>
          )}

          {phaseChecked && (
            <div className="space-y-4">
              {accuracyBar}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="btn-gold text-sm inline-flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  Continue
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="btn-outline text-sm inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- phase 5: full recall (textarea) ---- */}
      {phase === 5 && (
        <div className="space-y-4">
          <p className="text-cream/50 text-sm">
            All words are hidden. Type the entire passage from memory.
          </p>

          {!phaseChecked && (
            <div className="space-y-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={6}
                className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-4 py-3 text-cream font-serif text-base leading-relaxed focus:outline-none focus:border-gold-500/50 resize-none transition-colors"
                placeholder="Type the complete passage from memory..."
              />
              <button
                type="button"
                onClick={handleCheckFull}
                disabled={!userInput.trim()}
                className="btn-gold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check
              </button>
            </div>
          )}

          {phaseChecked && (
            <div className="space-y-4">
              {accuracyBar}

              <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-5">
                <p className="text-cream/50 text-xs font-medium mb-2">
                  Complete passage:
                </p>
                <p className="text-cream/80 font-serif leading-relaxed">
                  {fullText}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRestart}
                className="btn-outline text-sm inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
