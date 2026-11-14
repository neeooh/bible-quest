import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle,
  FolderPlus,
  Heart,
  X,
} from 'lucide-react';
import { formatScriptureRef, readPath, type ResolvedPassage } from '../../lib/ai/scripture-guard';
import { toCollectionSlug, uniqueCollectionName } from '../../lib/collections';
import { useCollections } from '../../hooks/useCollections';
import type { UseSavedVersesReturn } from '../../hooks/useSavedVerses';
import { showToast } from '../Toast';

export interface DrawerPassage {
  /** Passage key, e.g. "psalms:34:18-18". */
  key: string;
  passage: ResolvedPassage;
  /** The reply where it was first cited. */
  turnId: string;
}

interface PassagesDrawerProps {
  open: boolean;
  onClose: () => void;
  passages: DrawerPassage[];
  saved: UseSavedVersesReturn;
  /** Prefilled name for a new collection. */
  suggestedName: string;
  /** Shows the passage's card in the reply where it was cited. */
  onShowInChat: (turnId: string, key: string) => void;
}

type Step = { kind: 'list' } | { kind: 'save' } | { kind: 'done'; name: string; count: number };
const NEW = '__new__';

/**
 * Slide-over panel (from the right on larger screens, from the bottom on
 * phones) listing every passage cited in the conversation, with checkboxes
 * to save a selection to a collection.
 */
export default function PassagesDrawer({
  open,
  onClose,
  passages,
  saved,
  suggestedName,
  onShowInChat,
}: PassagesDrawerProps) {
  // Track what's unticked, so passages added while the panel is open start ticked.
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>({ kind: 'list' });
  const [target, setTarget] = useState<string>(NEW);
  const [name, setName] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const { collections, createCollection, addPassagesToCollection } = useCollections();

  const selected = useMemo(() => passages.filter((p) => !unticked.has(p.key)), [passages, unticked]);
  const allTicked = selected.length === passages.length;

  // Reset each time the panel opens (state adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUnticked(new Set());
      setStep({ kind: 'list' });
      setTarget(NEW);
      setName(suggestedName);
    }
  }

  // Escape closes; the page behind doesn't scroll while the panel is open.
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

  const toggle = (key: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () => setUnticked(allTicked ? new Set(passages.map((p) => p.key)) : new Set());

  const save = () => {
    if (selected.length === 0) return;
    let collectionId = target;
    let collectionName = collections.find((c) => c.id === target)?.name ?? '';
    if (target === NEW) {
      const trimmed = name.trim();
      if (!trimmed) return;
      collectionName = uniqueCollectionName(trimmed, collections);
      collectionId = createCollection(collectionName, 'Passages from an AI Chat conversation.', 'Sparkles');
    }

    // Collections show passages from My Verses, so make sure each one is there.
    saved.addVerses(
      selected.flatMap(({ passage }) =>
        passage.verses
          .filter((v) => !saved.isSaved(passage.ref.book, passage.ref.chapter, v.verse))
          .map((v) => ({
            book: passage.ref.book,
            chapter: passage.ref.chapter,
            verse: v.verse,
            text: v.text,
            reference: `${passage.ref.bookName} ${passage.ref.chapter}:${v.verse}`,
            favourite: false,
          })),
      ),
    );
    addPassagesToCollection(collectionId, selected.map((p) => p.key));
    showToast(`Saved ${selected.length} passage${selected.length === 1 ? '' : 's'} to “${collectionName}”`, 'success');
    setStep({ kind: 'done', name: collectionName, count: selected.length });
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-black/60 drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="passages-drawer-title"
        tabIndex={-1}
        className="drawer-panel absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-2xl bg-navy-800 border-t sm:border-t-0 sm:border-l border-gold-500/20 flex flex-col focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gold-500/10">
          <div className="flex items-center gap-2">
            {step.kind === 'save' && (
              <button
                type="button"
                onClick={() => setStep({ kind: 'list' })}
                aria-label="Back to the list"
                className="text-cream/50 hover:text-gold-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 id="passages-drawer-title" className="text-lg font-serif font-semibold text-cream">
              {step.kind === 'save' ? 'Save to a collection' : 'Passages in this chat'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-cream/40 hover:text-cream/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step.kind === 'list' && (
          <>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-cream/50">
                {selected.length} of {passages.length} selected
              </span>
              <button type="button" onClick={toggleAll} className="text-gold-400 hover:text-gold-300 transition-colors">
                {allTicked ? 'Clear all' : 'Select all'}
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
              {passages.map(({ key, passage, turnId }) => {
                const { ref, verses } = passage;
                const ticked = !unticked.has(key);
                const allSaved = verses.every((v) => saved.isSaved(ref.book, ref.chapter, v.verse));
                const allFav = verses.every((v) => saved.isFavourite(ref.book, ref.chapter, v.verse));
                const preview = verses.map((v) => v.text).join(' ');
                return (
                  <li
                    key={key}
                    className={`rounded-xl border p-3 transition-colors ${
                      ticked ? 'border-gold-500/30 bg-navy-700/50' : 'border-gold-500/10 bg-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={ticked}
                        onChange={() => toggle(key)}
                        aria-label={`Include ${formatScriptureRef(ref)}`}
                        className="mt-2 w-4 h-4 shrink-0 accent-gold-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Reference on the left, actions on the right */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onShowInChat(turnId, key)}
                            title="Show in the chat"
                            className="min-w-0 truncate text-gold-400 hover:text-gold-300 text-sm font-semibold text-left"
                          >
                            {formatScriptureRef(ref)}
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0 -mr-1.5">
                            <IconAction
                              label={allFav ? 'Remove from favourites' : 'Add to favourites'}
                              onClick={() => {
                                for (const v of verses) {
                                  if (allFav) saved.setFavourite(ref.book, ref.chapter, v.verse, false);
                                  else if (saved.isSaved(ref.book, ref.chapter, v.verse)) saved.setFavourite(ref.book, ref.chapter, v.verse, true);
                                  else saved.addVerse({ book: ref.book, chapter: ref.chapter, verse: v.verse, text: v.text, reference: `${ref.bookName} ${ref.chapter}:${v.verse}`, favourite: true });
                                }
                              }}
                            >
                              <Heart className={`w-4 h-4 ${allFav ? 'text-red-400' : ''}`} fill={allFav ? 'currentColor' : 'none'} />
                            </IconAction>
                            <IconAction
                              label={allSaved ? 'In My Verses' : 'Add to My Verses'}
                              disabled={allSaved}
                              onClick={() =>
                                saved.addVerses(
                                  verses
                                    .filter((v) => !saved.isSaved(ref.book, ref.chapter, v.verse))
                                    .map((v) => ({ book: ref.book, chapter: ref.chapter, verse: v.verse, text: v.text, reference: `${ref.bookName} ${ref.chapter}:${v.verse}`, favourite: false })),
                                )
                              }
                            >
                              {allSaved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                            </IconAction>
                            <Link
                              to={readPath(ref)}
                              onClick={onClose}
                              aria-label={`Read ${formatScriptureRef(ref)}`}
                              title="Read"
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-cream/50 hover:text-gold-400 hover:bg-gold-500/10 transition-colors"
                            >
                              <BookOpen className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                        <p className="mt-1 text-cream/60 text-sm leading-snug line-clamp-2 font-serif">{preview}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="px-5 py-4 border-t border-gold-500/10">
              <button
                type="button"
                onClick={() => setStep({ kind: 'save' })}
                disabled={selected.length === 0}
                className="btn-gold w-full inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:active:scale-100"
              >
                <FolderPlus className="w-4 h-4" />
                Save {selected.length} to a collection
              </button>
            </div>
          </>
        )}

        {step.kind === 'save' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <p className="text-cream/50 text-sm">
                {selected.length} passage{selected.length === 1 ? '' : 's'} will be added to the collection and to My Verses.
              </p>

              <label
                className={`block rounded-xl border p-3 cursor-pointer transition-colors ${
                  target === NEW ? 'border-gold-500/40 bg-navy-700/50' : 'border-gold-500/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="collection-target"
                    checked={target === NEW}
                    onChange={() => setTarget(NEW)}
                    className="w-4 h-4 accent-gold-500"
                  />
                  <span className="text-cream text-sm font-medium">New collection</span>
                </span>
                {target === NEW && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && save()}
                    aria-label="Collection name"
                    placeholder="Collection name"
                    autoFocus
                    className="mt-3 w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50"
                  />
                )}
              </label>

              {collections.length > 0 && (
                <>
                  <p className="text-cream/40 text-xs uppercase tracking-wider pt-2">Or add to an existing collection</p>
                  {collections.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                        target === c.id ? 'border-gold-500/40 bg-navy-700/50' : 'border-gold-500/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="collection-target"
                        checked={target === c.id}
                        onChange={() => setTarget(c.id)}
                        className="w-4 h-4 accent-gold-500"
                      />
                      <span className="flex-1 text-cream text-sm">{c.name}</span>
                      <span className="text-cream/40 text-xs">
                        {c.passageKeys.length} passage{c.passageKeys.length === 1 ? '' : 's'}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gold-500/10">
              <button
                type="button"
                onClick={save}
                disabled={target === NEW && !name.trim()}
                className="btn-gold w-full inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:active:scale-100"
              >
                <FolderPlus className="w-4 h-4" />
                Save {selected.length} passage{selected.length === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}

        {step.kind === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-5 py-10">
            <CheckCircle className="w-10 h-10 text-green-400" />
            <p className="text-cream">
              Saved {step.count} passage{step.count === 1 ? '' : 's'} to{' '}
              <span className="font-semibold">“{step.name}”</span>.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to={`/my-verses/collection/${toCollectionSlug(step.name)}`}
                onClick={onClose}
                className="btn-gold text-sm inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Open collection
              </Link>
              <button type="button" onClick={onClose} className="btn-outline text-sm">
                Back to chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-cream/50 hover:text-gold-400 hover:bg-gold-500/10 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-cream/50"
    >
      {children}
    </button>
  );
}
