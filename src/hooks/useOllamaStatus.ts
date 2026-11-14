import { useCallback, useEffect, useRef, useState } from 'react';
import { getVersion, listModels } from '../lib/ai/ollama-client';
import type { OllamaModel } from '../lib/ai/types';

export type OllamaStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'connected'; version: string; models: OllamaModel[] }
  | { state: 'error'; error: unknown };

/**
 * Checks whether Ollama is reachable at `baseUrl` and lists its models.
 * Runs automatically when `active` is true and whenever the URL changes;
 * call `refresh()` to check again.
 */
export function useOllamaStatus(baseUrl: string, active = true) {
  const [status, setStatus] = useState<OllamaStatus>(
    active ? { state: 'checking' } : { state: 'idle' },
  );
  const controllerRef = useRef<AbortController | null>(null);

  const check = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const [version, models] = await Promise.all([
        getVersion(baseUrl, controller.signal),
        listModels(baseUrl, controller.signal),
      ]);
      if (!controller.signal.aborted) setStatus({ state: 'connected', version, models });
    } catch (error) {
      if (!controller.signal.aborted) setStatus({ state: 'error', error });
    }
  }, [baseUrl]);

  /** Manual re-check (e.g. a "Test connection" button). */
  const refresh = useCallback(() => {
    setStatus({ state: 'checking' });
    return check();
  }, [check]);

  useEffect(() => {
    if (!active) return;
    // setState only runs after the network call resolves, not synchronously.
    // oxlint-disable-next-line react/set-state-in-effect
    void check();
    return () => controllerRef.current?.abort();
  }, [active, check]);

  /** Re-check in the background, keeping the current status until the result arrives. */
  const recheck = useCallback(() => check(), [check]);

  return { status, refresh, recheck };
}
