import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Minimal type definitions for the Web Speech API.                  */
/*  Keeps the hook self-contained regardless of TS lib configuration. */
/* ------------------------------------------------------------------ */

interface SRResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface SRResultList {
  readonly length: number;
  [index: number]: SRResult;
}

interface SREvent {
  readonly results: SRResultList;
  readonly resultIndex: number;
}

interface SRErrorEvent {
  readonly error: string;
  readonly message: string;
}

interface SRInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SREvent) => void) | null;
  onerror: ((event: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SRConstructor = new () => SRInstance;

/** Return the SpeechRecognition constructor (webkit-prefixed or standard). */
function getConstructor(): SRConstructor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | SRConstructor
    | null;
}

/* ------------------------------------------------------------------ */
/*  Public interface                                                   */
/* ------------------------------------------------------------------ */

export interface UseSpeechRecognitionReturn {
  /** True while the recogniser is actively listening. */
  isListening: boolean;
  /** Accumulated transcript (final + interim). */
  transcript: string;
  /** Human-readable error message, or empty string. */
  error: string;
  /** Begin a new recognition session. Clears previous transcript. */
  startListening: () => void;
  /** Stop the current session gracefully. */
  stopListening: () => void;
  /** Clear transcript and error state without stopping. */
  resetTranscript: () => void;
  /** True when the browser exposes a SpeechRecognition constructor. */
  isSupported: boolean;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SRInstance | null>(null);

  const isSupported = getConstructor() !== null;

  /* ---- start ---------------------------------------------------- */
  const startListening = useCallback(() => {
    const Ctor = getConstructor();
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Tear down a previous session if one is still alive.
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setError('');
    setTranscript('');

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SREvent) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const seg = event.results[i];
        if (seg.isFinal) {
          finalText += seg[0].transcript;
        } else {
          interimText += seg[0].transcript;
        }
      }
      setTranscript(finalText + interimText);
    };

    recognition.onerror = (event: SRErrorEvent) => {
      const messages: Record<string, string> = {
        'not-allowed':
          'Microphone access was denied. Allow microphone permissions and try again.',
        'no-speech':
          'No speech detected. Try speaking louder or closer to the microphone.',
        network: 'A network error occurred. Check your connection and try again.',
        'audio-capture':
          'No microphone found. Connect a microphone and try again.',
        aborted: 'Recording was stopped.',
      };
      setError(messages[event.error] ?? `Recognition error: ${event.error}`);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError('Could not start speech recognition. Try again.');
      setIsListening(false);
    }
  }, []);

  /* ---- stop ----------------------------------------------------- */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /* ---- reset ---------------------------------------------------- */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError('');
  }, []);

  /* ---- cleanup on unmount --------------------------------------- */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}
