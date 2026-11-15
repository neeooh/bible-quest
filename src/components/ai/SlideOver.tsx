import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Shown before the title, e.g. a back button. */
  headerStart?: ReactNode;
  children: ReactNode;
}

/**
 * Panel that slides in from the right on larger screens and up from the
 * bottom on phones, over a dimmed backdrop. Escape or a click on the
 * backdrop closes it; the page behind doesn't scroll while it's open.
 */
export default function SlideOver({ open, onClose, title, headerStart, children }: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Rendered at the document root so it always stacks above the page and the
  // fixed chat composer, even while the page's fade-in animation runs.
  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-black/60 drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="drawer-panel absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none min-[640px]:w-[440px] min-[1440px]:w-[520px] sm:rounded-none sm:rounded-l-2xl bg-navy-800 border-t sm:border-t-0 sm:border-l border-gold-500/20 flex flex-col focus:outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gold-500/10">
          <div className="flex items-center gap-2 min-w-0">
            {headerStart}
            <h2 id={titleId} className="text-lg font-serif font-semibold text-cream truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-cream/40 hover:text-cream/70 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
