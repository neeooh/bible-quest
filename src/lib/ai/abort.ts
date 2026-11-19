/**
 * Links an optional caller signal with an internal timeout. `timedOut()`
 * tells the two kinds of abort apart.
 */
export function createAbortScope(outer: AbortSignal | undefined) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let didTimeOut = false;

  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort, { once: true });
  }

  return {
    signal: controller.signal,
    timedOut: () => didTimeOut,
    startTimer(ms: number) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        didTimeOut = true;
        controller.abort();
      }, ms);
    },
    dispose() {
      clearTimeout(timer);
      outer?.removeEventListener('abort', onOuterAbort);
    },
  };
}

export type AbortScope = ReturnType<typeof createAbortScope>;
