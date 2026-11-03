import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Check, Eye, EyeOff, Mic, MicOff } from 'lucide-react';
import type { ExerciseProps } from '../../lib/types';
import { compareTexts, type CompareResult } from '../../lib/word-compare';
import { formatReference } from '../../lib/bible';
import { getEncouragement } from '../../lib/encouragement';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export default function Recitation({
  verses,
  bookName,
  chapter,
  startVerse,
  endVerse,
  onComplete,
}: ExerciseProps) {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: voiceSupported,
  } = useSpeechRecognition();

  const fullText = useMemo(
    () => verses.map((v) => v.text).join(' '),
    [verses],
  );

  const reference = formatReference(
    bookName,
    chapter,
    startVerse,
    startVerse !== endVerse ? endVerse : undefined,
  );

  // Sync transcript into the text input
  const effectiveInput = isListening ? transcript : userInput;

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      // Copy transcript into the editable input
      setUserInput(transcript);
    } else {
      resetTranscript();
      setUserInput('');
      startListening();
    }
  }, [isListening, transcript, startListening, stopListening, resetTranscript]);

  const handleCheck = useCallback(() => {
    const text = isListening ? transcript : userInput;
    const cmp = compareTexts(fullText, text);
    setResult(cmp);
    if (isListening) stopListening();
    onComplete(cmp.accuracy);
  }, [fullText, userInput, transcript, isListening, stopListening, onComplete]);

  const handleReset = useCallback(() => {
    setUserInput('');
    setResult(null);
    setShowOriginal(false);
    resetTranscript();
  }, [resetTranscript]);

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
      {/* Header */}
      <div>
        <h3 className="text-lg font-serif font-semibold text-cream">
          Full Recitation
        </h3>
        <p className="text-cream/40 text-sm">
          Type or speak the passage from memory.
        </p>
      </div>

      {/* Input area */}
      {!result && (
        <div className="space-y-3">
          {/* Textarea + mic button */}
          <div className="relative">
            <textarea
              value={isListening ? transcript : userInput}
              onChange={(e) => {
                if (!isListening) setUserInput(e.target.value);
              }}
              readOnly={isListening}
              rows={8}
              className={`w-full bg-navy-700 border rounded-lg px-4 py-3 pr-14 text-cream font-serif text-base leading-relaxed focus:outline-none resize-none transition-colors ${
                isListening
                  ? 'border-red-500/40 focus:border-red-500/50'
                  : 'border-gold-500/20 focus:border-gold-500/50'
              }`}
              placeholder={
                isListening
                  ? 'Listening...'
                  : 'Type the passage from memory...'
              }
              autoFocus
            />

            {/* Mic button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={handleMicToggle}
                className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-gold-500/10 text-cream/40 hover:text-gold-400 hover:bg-gold-500/20'
                }`}
                aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                title={isListening ? 'Stop recording' : 'Speak the passage'}
              >
                {isListening ? (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-25" />
                    <MicOff className="w-5 h-5 relative z-10" />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {isListening && (
            <p className="text-red-400 text-xs animate-pulse">
              Listening… tap the mic to stop
            </p>
          )}

          <button
            type="button"
            onClick={handleCheck}
            disabled={!effectiveInput.trim() || isListening}
            className="btn-gold text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Check
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
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

          <p className="text-cream/50 text-sm">{getEncouragement(result.accuracy)}</p>

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
                    title = 'Incorrect';
                    break;
                  case 'missing':
                    cls = 'text-red-400 line-through decoration-red-500/50';
                    title = 'Missing';
                    break;
                  case 'extra':
                    cls = 'text-cream/20 italic';
                    title = 'Extra';
                    break;
                }
                return (
                  <span key={i} className={`${cls} mr-1`} title={title}>
                    {w.word}
                  </span>
                );
              })}
            </div>

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
