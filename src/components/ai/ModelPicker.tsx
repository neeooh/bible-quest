import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronUp, Cpu, Loader2, Settings } from 'lucide-react';
import { formatModelSize, pickModel, shortModelName } from '../../lib/ai/ai-settings';
import type { OllamaStatus } from '../../hooks/useOllamaStatus';

interface ModelPickerProps {
  /** The saved model ("" when none chosen yet). */
  model: string;
  status: OllamaStatus;
  onChange: (model: string) => void;
  /** Re-reads the installed models from Ollama. */
  onRefresh: () => void;
}

/**
 * Pill showing the model in use. Opens a menu upwards (it sits at the bottom
 * of the screen) to switch between the models installed in Ollama.
 */
export default function ModelPicker({ model, status, onChange, onRefresh }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const models = status.state === 'connected' ? status.models : [];
  // What the chat will actually use: the saved model, or the automatic pick.
  const current = model || pickModel(models, '');
  const label = current ? shortModelName(current) : 'Choose model';

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  // Focus the selected item when the menu opens.
  useEffect(() => {
    if (!open) return;
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role=menuitemradio]');
    const selected = [...(items ?? [])].find((el) => el.getAttribute('aria-checked') === 'true');
    (selected ?? items?.[0])?.focus();
  }, [open, models.length]);

  const toggle = () => {
    if (!open) onRefresh(); // pick up models pulled since the page loaded
    setOpen(!open);
  };

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role=menuitemradio]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      items[(i + 1) % items.length].focus();
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length].focus();
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Model: ${label}. Change model`}
        title="Change model"
        className="inline-flex items-center gap-1.5 max-w-[9rem] sm:max-w-[12rem] rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-300 hover:bg-gold-500/20 hover:border-gold-500/50 transition-colors"
      >
        <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
        <ChevronUp
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? '' : 'rotate-180'}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label="Choose a model"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 bottom-full mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gold-500/20 bg-navy-800 shadow-2xl shadow-black/40 py-2 z-50 page-enter"
        >
          <p className="px-4 pt-1 pb-2 text-cream/40 text-[11px] uppercase tracking-wider">Model</p>

          {status.state === 'checking' && models.length === 0 && (
            <p className="flex items-center gap-2 px-4 py-2 text-cream/60 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
              Loading models…
            </p>
          )}

          {status.state === 'error' && (
            <p className="px-4 py-2 text-cream/60 text-sm">Couldn’t load models from Ollama.</p>
          )}

          {status.state === 'connected' && models.length === 0 && (
            <p className="px-4 py-2 text-cream/60 text-sm">
              No models installed. Run <code className="text-gold-400">ollama pull gemma3</code>.
            </p>
          )}

          <div className="max-h-64 overflow-y-auto">
            {models.map((m) => {
              const selected = m.name === current;
              return (
                <button
                  key={m.name}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => choose(m.name)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gold-500/10 focus:bg-gold-500/10 focus:outline-none ${
                    selected ? 'text-gold-300' : 'text-cream/80'
                  }`}
                >
                  <Check className={`w-4 h-4 shrink-0 ${selected ? '' : 'invisible'}`} aria-hidden="true" />
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-cream/40 text-xs shrink-0">
                    {[formatModelSize(m.size), m.parameterSize].filter(Boolean).join(' · ')}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-1 border-t border-gold-500/10 pt-1">
            <Link
              to="/settings/ai"
              className="flex items-center gap-3 px-4 py-2 text-sm text-cream/60 hover:text-gold-400 hover:bg-gold-500/10 transition-colors"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              AI settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
