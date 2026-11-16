import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { useAiSettings } from '../../hooks/useAiSettings';

/**
 * One-line note at the end of the chat. The full wording opens in a small
 * popup above it.
 */
export default function AiDisclaimer() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const { settings } = useAiSettings();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <p className="flex items-center gap-1.5 text-cream/40 text-xs leading-snug">
        AI-generated guidance — it can make mistakes.
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={open ? popupId : undefined}
          aria-label="About AI guidance"
          title="About AI guidance"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-cream/40 hover:text-gold-400 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </p>

      {open && (
        <div
          id={popupId}
          role="note"
          className="absolute left-0 bottom-full mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gold-500/20 bg-navy-800 shadow-2xl shadow-black/40 p-4 text-cream/70 text-xs leading-relaxed page-enter z-50"
        >
          {settings.provider === 'hosted'
            ? 'Replies come from an AI model run by BibleQuest’s AI provider. Your messages are sent to it to get a reply and are not stored by BibleQuest.'
            : 'Replies come from an AI model running on your own Mac.'}{' '}
          They may contain mistakes and are
          not a substitute for a pastor, counsellor or doctor. Verse text is always shown from the
          World English Bible.
        </div>
      )}
    </div>
  );
}
