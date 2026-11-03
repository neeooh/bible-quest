import { useCallback, useEffect, useState } from 'react';

const VOICE_KEY = 'biblequest_tts_voice';

function getStoredVoiceName(): string {
  try {
    return localStorage.getItem(VOICE_KEY) ?? '';
  } catch {
    return '';
  }
}

export interface UseTextToSpeechReturn {
  /** Whether the browser supports speech synthesis. */
  isSupported: boolean;
  /** Whether speech is currently playing. */
  isSpeaking: boolean;
  /** Available voices (English only). */
  voices: SpeechSynthesisVoice[];
  /** Currently selected voice name. */
  selectedVoice: string;
  /** Set the preferred voice by name. Persists in localStorage. */
  setVoice: (name: string) => void;
  /** Speak the given text. Stops any current speech first. */
  speak: (text: string) => void;
  /** Stop any current speech. */
  stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(getStoredVoiceName);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices — they may arrive asynchronously
  useEffect(() => {
    if (!isSupported) return;

    function loadVoices() {
      const all = speechSynthesis.getVoices();
      // Filter to English voices
      const english = all.filter((v) => v.lang.startsWith('en'));
      setVoices(english.length > 0 ? english : all);
    }

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const setVoice = useCallback((name: string) => {
    setSelectedVoice(name);
    try {
      localStorage.setItem(VOICE_KEY, name);
    } catch {
      // ignore
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Stop any current speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Find the selected voice
      if (selectedVoice) {
        const voice = voices.find((v) => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    },
    [isSupported, selectedVoice, voices],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) speechSynthesis.cancel();
    };
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    setVoice,
    speak,
    stop,
  };
}
