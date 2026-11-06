import { useState, useEffect } from 'react';
import { X, Plus, FolderPlus, Check } from 'lucide-react';
import type { Collection } from '../../lib/collections';

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  passageKey: string;
  collections: Collection[];
  onAddPassageToCollections: (passageKey: string, collectionIds: string[]) => void;
  onCreateCollection: (name: string, description: string) => void;
}

export default function AddToCollectionDialog({
  isOpen,
  onClose,
  passageKey,
  collections,
  onAddPassageToCollections,
  onCreateCollection,
}: AddToCollectionDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Pre-check collections that already contain this passage
      const initial = new Set<string>();
      for (const c of collections) {
        if (c.passageKeys.includes(passageKey)) {
          initial.add(c.id);
        }
      }
      setSelected(initial);
      setShowCreate(false);
      setNewName('');
    }
  }, [isOpen, passageKey, collections]);

  if (!isOpen) return null;

  function toggleCollection(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleCreateInline() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateCollection(trimmed, '');
    setNewName('');
    setShowCreate(false);
    // The new collection will appear after re-render; select it in the next effect
  }

  function handleSave() {
    onAddPassageToCollections(passageKey, Array.from(selected));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-navy-800 border border-gold-500/20 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-serif font-bold text-cream flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-gold-400" />
            Add to Collection
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/30 hover:text-cream/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {collections.length === 0 && !showCreate && (
            <p className="text-cream/40 text-sm py-4 text-center">
              No collections yet. Create one below.
            </p>
          )}

          {collections.map((c) => {
            const isChecked = selected.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCollection(c.id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-navy-700"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                    isChecked
                      ? 'bg-gold-500 border-gold-500'
                      : 'border-cream/20'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 text-navy-900" />}
                </div>
                <span className={isChecked ? 'text-cream' : 'text-cream/60'}>
                  {c.name}
                </span>
                <span className="text-cream/25 text-xs ml-auto">
                  {c.passageKeys.length} passage{c.passageKeys.length !== 1 ? 's' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Inline create */}
        <div className="mt-4 pt-4 border-t border-gold-500/10">
          {showCreate ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name..."
                className="flex-1 bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold-500/50 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateInline();
                  if (e.key === 'Escape') setShowCreate(false);
                }}
              />
              <button
                type="button"
                onClick={handleCreateInline}
                disabled={!newName.trim()}
                className="btn-gold text-sm px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 text-gold-400 text-sm hover:text-gold-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Collection
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline text-sm px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-gold text-sm px-4 py-2"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
