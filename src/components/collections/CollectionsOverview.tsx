import { useState } from 'react';
import { FolderPlus, Search, FolderOpen, X } from 'lucide-react';
import type { Collection } from '../../lib/collections';

interface CollectionsOverviewProps {
  collections: Collection[];
  onCreateCollection: () => void;
  onNavigateToCollection: (id: string) => void;
}

export default function CollectionsOverview({
  collections,
  onCreateCollection,
  onNavigateToCollection,
}: CollectionsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? collections.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      )
    : collections;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCreateCollection}
          className="btn-gold text-sm inline-flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          Create Collection
        </button>
      </div>

      {/* Search */}
      {collections.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full bg-navy-700 border border-gold-500/20 rounded-lg pl-10 pr-10 py-2.5 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {collections.length === 0 ? (
        <div className="card flex flex-col items-center text-center py-12 space-y-4">
          <FolderOpen className="w-12 h-12 text-cream/25" />
          <p className="text-cream text-lg font-semibold">
            No collections yet.
          </p>
          <p className="text-cream/40 text-sm">
            Create a collection to organise your saved passages.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-cream/40 text-sm">
            No collections match your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onNavigateToCollection(c.id)}
              className="card text-left hover:border-gold-500/30 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-cream font-semibold text-base truncate">
                  {c.name}
                </p>
                <p className="text-cream/40 text-xs mt-1">
                  {c.passageKeys.length} passage{c.passageKeys.length !== 1 ? 's' : ''}
                </p>
                {c.description && (
                  <p className="text-cream/30 text-sm mt-2 line-clamp-2">
                    {c.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
