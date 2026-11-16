import { useEffect, useState } from 'react';
import { refKey, resolvePassage, type ResolvedPassage, type ScriptureRef } from '../lib/ai/scripture-guard';

/** Shared across messages so each passage is only looked up once. */
const cache = new Map<string, Promise<ResolvedPassage | null>>();

function lookup(ref: ScriptureRef): Promise<ResolvedPassage | null> {
  const key = refKey(ref);
  let pending = cache.get(key);
  if (!pending) {
    pending = resolvePassage(ref).catch(() => null);
    cache.set(key, pending);
  }
  return pending;
}

/**
 * Loads the real WEB text for each verse reference.
 * Map value: undefined = still loading, null = not a real passage.
 */
export function useResolvedPassages(refs: ScriptureRef[]): Map<string, ResolvedPassage | null> {
  const [resolved, setResolved] = useState(() => new Map<string, ResolvedPassage | null>());
  const keys = refs.map(refKey).join('|');

  useEffect(() => {
    let cancelled = false;
    for (const ref of refs) {
      const key = refKey(ref);
      void lookup(ref).then((result) => {
        if (cancelled) return;
        setResolved((prev) => {
          if (prev.has(key) && prev.get(key) === result) return prev;
          const next = new Map(prev);
          next.set(key, result);
          return next;
        });
      });
    }
    return () => {
      cancelled = true;
    };
    // `keys` captures the identity of `refs`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  return resolved;
}
