import { useState, useMemo, useCallback } from 'react';
import { Mic, MicOff, RotateCcw, AlertTriangle } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { compareTexts, type CompareResult } from '../../lib/word-compare';
import { formatReference } from '../../lib/bible';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export default function VoiceRecitation({
  verses,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  const [result, setResult] = useState<CompareResult | null>(null);
  const [manualInput, setManualInput] = useState('');

  const fullText = useMemo(
    () => verses.map((v) => v.text).join(' '),
    [verses],
  );

  const reference = formatReference(
    chapter,
    startVerse,
    startVerse !== endVerse ? endVerse : undefined,
  );

  /** Whichever text the user produced — voice transcript or typed fallback. */
  const effectiveText = isSupported ? transcript : manualInput;

  /* ---- handlers -------------------------------------------------- */
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleCheck = useCallback(() => {
    const cmp = compareTexts(fullText, effectiveText);
    setResult(cmp);
    onComplete(cmp.accuracy);
  }, [fullText, effectiveText, onComplete]);

  const handleReset = useCallback(() => {
    setResult(null);
    setManualInput('');
    resetTranscript();
  }, [resetTranscript]);

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
          Voice Recitation
        </h3>
        <p className="text-cream/40 text-sm">Recite {reference} aloud.</p>
      </div>

      {/* ---- not-supported banner ---- */}
      {!isSupported && (
        <div className="bg-navy-700/50 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-cream/80 text-sm font-medium">
              Speech recognition is not available
            </p>
            <p className="text-cream/40 text-xs mt-1">
              Use Google Chrome for voice input. You can type the passage below
              instead.
            </p>
          </div>
        </div>
      )}

      {/* ---- recording UI ---- */}
      {!result && (
        <div className="space-y-5">
          {/* microphone button */}
          {isSupported && (
            <div className="flex flex-col items-center gap-4 py-2">
              <button
                type="button"
                onClick={handleMicToggle}
                className={[
                  'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200',
                  isListening
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-gold-500/20 text-gold-400 hover:bg-gold-500/30',
                ].join(' ')}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
              >
                {/* animated rings */}
                {isListening && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-25" />
                    <span className="absolute inset-[-4px] rounded-full border-2 border-red-500/40 animate-pulse" />
                  </>
                )}
                {isListening ? (
                  <MicOff className="w-8 h-8 relative z-10" />
                ) : (
                  <Mic className="w-8 h-8 relative z-10" />
                )}
              </button>

              <p
                className={`text-sm transition-colors ${
                  isListening ? 'text-red-400 animate-pulse' : 'text-cream/40'
                }`}
              >
                {isListening
                  ? 'Listening… tap to stop'
                  : 'Tap to start recording'}
              </p>
            </div>
          )}

          {/* error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* live transcript */}
          {isSupported && transcript && (
            <div className="space-y-2">
              <p className="text-cream/40 text-xs font-medium">
                Your recitation:
              </p>
              <div className="bg-navy-700/50 border border-gold-500/10 rounded-lg p-4">
                <p className="text-cream/80 font-serif leading-relaxed">
                  {transcript}
                  {isListening && (
                    <span className="inline-block w-0.5 h-4 bg-gold-500 ml-1 animate-pulse align-text-bottom" />
                  )}
                </p>
              </div>
            </div>
          )}

          {/* fallback textarea when speech is unsupported */}
          {!isSupported && (
            <div className="space-y-2">
              <p className="text-cream/40 text-xs font-medium">
                Type the passage instead:
              </p>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                rows={6}
                className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-4 py-3 text-cream font-serif text-base leading-relaxed focus:outline-none focus:border-gold-500/50 resize-none transition-colors"
                placeholder="Type the passage here…"
              />
            </div>
          )}

          {/* check button — visible once there is text and recording stopped */}
          {effectiveText.trim().length > 0 && !isListening && (
            <button
              type="button"
              onClick={handleCheck}
              className="btn-gold text-sm"
            >
              Check My Recitation
            </button>
          )}
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
                switch (w.status) {
                  case 'correct':
                    cls = 'text-green-400';
                    break;
                  case 'incorrect':
                    cls =
                      'text-yellow-400 underline decoration-yellow-500/30 decoration-wavy';
                    break;
                  case 'missing':
                    cls = 'text-red-400 line-through decoration-red-500/50';
                    break;
                  case 'extra':
                    cls = 'text-cream/20 italic';
                    break;
                }
                return (
                  <span key={i} className={`${cls} mr-1`}>
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
