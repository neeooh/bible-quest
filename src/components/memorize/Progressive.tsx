import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, ChevronRight, BookOpen } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { compareTexts } from '../../lib/word-compare';
import { formatReference } from '../../lib/bible';

const PHASE_LABELS = ['Read', '25%', '50%', '75%', 'Full Recall'];
const PHASE_HIDE = [0, 0.25, 0.5, 0.75, 1.0];

export default function Progressive({
  verses,
  bookName,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const [phase, setPhase] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [phaseChecked, setPhaseChecked] = useState(false);
  const [phaseAccuracy, setPhaseAccuracy] = useState<number | null>(null);

  const fullText = useMemo(
    () => verses.map((v) => v.text).join(' '),
    [verses],
  );

  const allWords = useMemo(
    () => fullText.split(/\s+/).filter((w) => w.length > 0),
    [fullText],
  );

  const totalWords = allWords.length;

  const reference = formatReference(
    bookName,
    chapter,
    startVerse,
    startVerse !== endVerse ? endVerse : undefined,
  );

  /*
   * Pre-shuffle all word indices once per session.
   * Each phase hides a growing prefix of this order, so phase N always
   * includes every word hidden in phase N-1 plus new ones.
   */
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

  /* ---- handlers -------------------------------------------------- */
  const handleCheck = useCallback(() => {
    const result = compareTexts(fullText, userInput);
    setPhaseAccuracy(result.accuracy);
    setPhaseChecked(true);
    if (phase === 5) {
      onComplete(result.accuracy);
    }
  }, [fullText, userInput, phase, onComplete]);

  const handleContinue = useCallback(() => {
    setPhase((p) => Math.min(p + 1, 5));
    setUserInput('');
    setPhaseChecked(false);
    setPhaseAccuracy(null);
  }, []);

  const handleRestart = useCallback(() => {
    setPhase(1);
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

  /* ---- accuracy bar (reused) ------------------------------------ */
  const accuracyBar =
    phaseAccuracy !== null ? (
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
    ) : null;

  /* ---- passage display with blanks ------------------------------ */
  const passageWithBlanks = (
    <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-5">
      <p className="font-serif text-lg leading-relaxed">
        {allWords.map((word, i) =>
          hiddenSet.has(i) ? (
            <span key={i} className="text-cream/20 mx-0.5">
              {'_'.repeat(Math.max(word.length, 3))}
            </span>
          ) : (
            <span key={i} className="text-cream/90">
              {word}
            </span>
          ),
        ).reduce<React.ReactNode[]>((acc, node, i) => {
          if (i > 0) acc.push(' ');
          acc.push(node);
          return acc;
        }, [])}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ---- header ---- */}
      <div>
        <h3 className="text-lg font-serif font-semibold text-cream">
          Progressive Recall
        </h3>
        <p className="text-cream/40 text-sm">{reference}</p>
      </div>

      {stepper}

      {/* ---- phase 1: read ---- */}
      {phase === 1 && (
        <div className="space-y-4">
          <p className="text-cream/50 text-sm">
            Read the passage carefully. Press Ready when you feel prepared.
          </p>
          <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-5">
            <p className="text-cream/90 font-serif text-lg leading-relaxed">
              {fullText}
            </p>
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

      {/* ---- phases 2–4: partial recall ---- */}
      {phase >= 2 && phase <= 4 && (
        <div className="space-y-4">
          <p className="text-cream/50 text-sm">
            {Math.round(PHASE_HIDE[phase - 1] * 100)}% of the words are hidden.
            Type the complete passage from memory.
          </p>

          {passageWithBlanks}

          {!phaseChecked && (
            <div className="space-y-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={5}
                className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-4 py-3 text-cream font-serif text-base leading-relaxed focus:outline-none focus:border-gold-500/50 resize-none transition-colors"
                placeholder="Type the complete passage..."
              />
              <button
                type="button"
                onClick={handleCheck}
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

      {/* ---- phase 5: full recall ---- */}
      {phase === 5 && (
        <div className="space-y-4">
          <p className="text-cream/50 text-sm">
            All words are hidden. Type the entire passage from memory.
          </p>

          <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-5 text-center">
            <p className="text-gold-400 font-serif text-xl font-semibold">
              {reference}
            </p>
            <p className="text-cream/20 text-sm mt-1">{totalWords} words</p>
          </div>

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
                onClick={handleCheck}
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

              {/* show correct passage after final check */}
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
