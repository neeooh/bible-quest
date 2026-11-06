import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { COLLECTION_ICONS, DEFAULT_COLLECTION_ICON } from '../../lib/collections';

interface CreateCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, icon: string) => void;
  onDelete?: () => void;
  initialName?: string;
  initialDescription?: string;
  initialIcon?: string;
  title?: string;
}

export default function CreateCollectionDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialName = '',
  initialDescription = '',
  initialIcon = DEFAULT_COLLECTION_ICON,
  title = 'Create Collection',
}: CreateCollectionDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [icon, setIcon] = useState(initialIcon);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setIcon(initialIcon);
    }
  }, [isOpen, initialName, initialDescription, initialIcon]);

  if (!isOpen) return null;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, description.trim(), icon);
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
          <h2 className="text-lg font-serif font-bold text-cream">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/30 hover:text-cream/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Icon picker */}
          <div>
            <label className="block text-sm text-cream/60 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLLECTION_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                    icon === emoji
                      ? 'bg-gold-500/20 ring-2 ring-gold-500 scale-110'
                      : 'bg-navy-700 hover:bg-navy-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="collection-name" className="block text-sm text-cream/60 mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Psalms of Praise"
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold-500/50 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="collection-description" className="block text-sm text-cream/60 mb-1.5">
              Description
            </label>
            <textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center mt-6">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm text-cream/30 hover:text-red-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
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
              disabled={!name.trim()}
              className="btn-gold text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
