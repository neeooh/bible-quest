import { useEffect, useState, type RefObject } from 'react';

/**
 * Tracks an element's rendered height. Also exposes it as the CSS variable
 * --bottom-bar-height on <html>, so other fixed UI (toasts) can sit above it.
 */
export function useElementHeight(ref: RefObject<HTMLElement | null>, active = true): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setHeight(h);
      root.style.setProperty('--bottom-bar-height', `${h}px`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--bottom-bar-height');
      setHeight(0);
    };
  }, [ref, active]);

  return height;
}
