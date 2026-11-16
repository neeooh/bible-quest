import { useCallback, useEffect, useState } from 'react';
import {
  AI_SETTINGS_EVENT,
  getAiSettings,
  saveAiSettings,
  type AiSettings,
} from '../lib/ai/ai-settings';

/** AI settings, kept in sync across every component (and tab) that uses them. */
export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(getAiSettings);

  useEffect(() => {
    const sync = () => setSettings(getAiSettings());
    window.addEventListener(AI_SETTINGS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AI_SETTINGS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const update = useCallback((updates: Partial<AiSettings>) => {
    setSettings(saveAiSettings(updates));
  }, []);

  return { settings, update };
}
