import type { ReactNode } from 'react';
import { useAiSettings } from '../../hooks/useAiSettings';

/** Renders its children only when the AI assistant is enabled in settings. */
export default function AiOnly({ children }: { children: ReactNode }) {
  const { settings } = useAiSettings();
  return settings.enabled ? <>{children}</> : null;
}
