import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { useCollections } from '../hooks/useCollections';
import { getBookBySlug } from '../lib/book-metadata';
import {
  getPassageStage,
  type LearningStage,
} from '../lib/learning-stage';
import {
  ArrowLeft,
  Edit,
  Search,
  Brain,
  BookOpen,
  Heart,
  Trash2,
  X,
  FolderOpen,
} from 'lucide-react';
import CreateCollectionDialog from '../components/collections/CreateCollectionDialog';

interface UnifiedEntry {
  key: string;
  book: string;
  bookName: string;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  reference: string;
  text: string;
  isFavourite: boolean;
  bestAccuracy: number;
  lastPractised: number;
  timesCompleted: number;
  stage: LearningStage;
  stageLabel: string;
}

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { savedVerses, addVerse, setFavourite, isSaved, isFavourite } = useSavedVerses();
  const {
    collections,
    updateCollection,
    deleteCollection,
    removePassageFromCollection,
  } = useCollections();

  const collection = collections.find((c) => c.id === id);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const entries: UnifiedEntry[] = useMemo(() => {
    if (!collection) return [];

    const result: UnifiedEntry[] = [];

    for (const passageKey of collection.passageKeys) {
      const parts = passageKey.split(':');
      if (parts.length !== 3) continue;
      const bookSlug = parts[0];
      const chapterNumber = parseInt(parts[1], 10);
      const verseParts = parts[2].split('-');
      const startVerse = parseInt(verseParts[0], 10);
      const endVerse = parseInt(verseParts[1] ?? verseParts[0], 10);

      if (isNaN(chapterNumber) || isNaN(startVerse) || isNaN(endVerse)) continue;

      const bookMeta = getBookBySlug(bookSlug);
      const bookName = bookMeta?.name ?? bookSlug;

      const ref =
        startVerse === endVerse
          ? `${bookName} ${chapterNumber}:${startVerse}`
          : `${bookName} ${chapterNumber}:${startVerse}–${endVerse}`;

      // Gather stats from exercise history
      const matching = progress.exerciseHistory.filter(
        (e) =>
          (e.book ?? 'matthew') === bookSlug &&
          e.chapterNumber === chapterNumber &&
          e.startVerse === startVerse &&
          e.endVerse === endVerse,
      );

      const bestAccuracy = matching.reduce((max, e) => Math.max(max, e.accuracy), 0);
      const lastPractised = matching.reduce((max, e) => Math.max(max, e.timestamp), 0);
      const timesCompleted = matching.length;

      // Get passage text from exercise history or saved verses
      let text = '';
      for (const e of matching) {
        if (e.passageText) { text = e.passageText; break; }
      }
      if (!text) {
        for (const sv of savedVerses) {
          if (
            sv.book === bookSlug &&
            sv.chapter === chapterNumber &&
            sv.verse >= startVerse &&
            sv.verse <= endVerse &&
            sv.text
          ) {
            text = sv.text;
            break;
          }
        }
      }

      // Check favourite status
      let favourite = false;
      for (let v = startVerse; v <= endVerse; v++) {
        if (isFavourite(bookSlug, chapterNumber, v)) {
          favourite = true;
          break;
        }
      }

      const ps = getPassageStage(
        progress.exerciseHistory,
        bookSlug,
        chapterNumber,
        startVerse,
        endVerse,
      );

      result.push({
        key: passageKey,
        book: bookSlug,
        bookName,
        chapterNumber,
        startVerse,
        endVerse,
        reference: ref,
        text,
        isFavourite: favourite,
        bestAccuracy,
        lastPractised,
        timesCompleted,
        stage: ps.stage,
        stageLabel: ps.label,
      });
    }

    return result;
  }, [collection, progress.exerciseHistory, savedVerses, isFavourite]);

  const filtered = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim();
    if (!needle) return entries;
    return entries.filter(
      (e) =>
        e.reference.toLowerCase().includes(needle) ||
        e.text.toLowerCase().includes(needle),
    );
  }, [entries, searchQuery]);

  function toggleFavourite(entry: UnifiedEntry) {
    if (entry.isFavourite) {
      for (let v = entry.startVerse; v <= entry.endVerse; v++) {
        if (isFavourite(entry.book, entry.chapterNumber, v)) {
          setFavourite(entry.book, entry.chapterNumber, v, false);
        }
      }
    } else {
      if (isSaved(entry.book, entry.chapterNumber, entry.startVerse)) {
        setFavourite(entry.book, entry.chapterNumber, entry.startVerse, true);
      } else {
        addVerse({
          book: entry.book,
          chapter: entry.chapterNumber,
          verse: entry.startVerse,
          text: entry.text,
          reference: entry.reference,
        });
      }
    }
  }

  if (!collection) {
    return (
      <div className="py-10 space-y-6">
        <Link
          to="/my-verses?tab=collections"
          className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </Link>
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-cream/25 mx-auto mb-4" />
          <p className="text-cream text-lg font-semibold">Collection not found.</p>
          <p className="text-cream/40 text-sm mt-1">
            It may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 space-y-6">
      {/* Back link */}
      <Link
        to="/my-verses?tab=collections"
        className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-cream">
            {collection.name}
          </h1>
          <p className="text-cream/40 mt-1 text-sm">
            {collection.passageKeys.length} passage{collection.passageKeys.length !== 1 ? 's' : ''}
            {collection.description && (
              <span> &middot; {collection.description}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditDialogOpen(true)}
            className="btn-outline text-sm inline-flex items-center gap-1.5 px-3 py-2"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete "${collection.name}"? Passages will not be removed from My Verses.`)) {
                deleteCollection(collection.id);
                navigate('/my-verses?tab=collections');
              }
            }}
            className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/30 hover:text-red-400 hover:border-red-400/40 transition-colors flex items-center justify-center"
            aria-label={`Delete ${collection.name}`}
            title="Delete collection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      {entries.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passages..."
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

      {/* Passage list */}
      {entries.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-cream/25 mx-auto mb-4" />
          <p className="text-cream text-lg font-semibold">No passages yet.</p>
          <p className="text-cream/40 text-sm mt-1">
            Add passages from the My Verses page.
          </p>
          <Link
            to="/my-verses"
            className="btn-gold inline-flex items-center gap-2 mt-4 text-sm"
          >
            Go to My Verses
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-cream/40 text-sm">No passages match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.key}
              className={`card flex items-start justify-between gap-4 border-l-4 ${
                entry.isFavourite ? 'border-l-gold-500' : 'border-l-navy-600'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base text-gold-400 font-serif font-semibold">
                    {entry.reference}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      entry.stage === 'learning'
                        ? 'bg-blue-500/15 text-blue-400'
                        : entry.stage === 'memorising'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-green-500/15 text-green-400'
                    }`}
                  >
                    {entry.stageLabel}
                  </span>
                </div>

                {entry.text && (
                  <p
                    className={`text-cream/80 text-base mt-3 italic leading-relaxed cursor-pointer hover:text-cream transition-colors ${
                      expandedCards.has(entry.key) ? '' : 'line-clamp-2'
                    }`}
                    onClick={() =>
                      setExpandedCards((prev) => {
                        const next = new Set(prev);
                        if (next.has(entry.key)) next.delete(entry.key);
                        else next.add(entry.key);
                        return next;
                      })
                    }
                    title={expandedCards.has(entry.key) ? 'Click to collapse' : 'Click to expand'}
                  >
                    &ldquo;{entry.text}&rdquo;
                  </p>
                )}

                {entry.timesCompleted > 0 && (
                  <p className="text-cream/40 text-xs mt-3">
                    Best: {Math.round(entry.bestAccuracy * 100)}% &middot; {entry.timesCompleted} session{entry.timesCompleted > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  to={`/memorize?book=${entry.book}&chapter=${entry.chapterNumber}&start=${entry.startVerse}&end=${entry.endVerse}`}
                  className="btn-gold text-sm inline-flex items-center justify-center gap-1.5 w-full"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Practise
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/read/${entry.book}/${entry.chapterNumber}?verse=${entry.startVerse}`}
                    className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/40 hover:text-gold-400 hover:border-gold-500/40 transition-colors flex items-center justify-center"
                    aria-label={`Read ${entry.reference}`}
                    title="Read"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFavourite(entry)}
                    className={`w-9 h-9 rounded-lg border transition-colors flex items-center justify-center ${
                      entry.isFavourite
                        ? 'border-gold-500/30 text-red-400 hover:text-red-300'
                        : 'border-gold-500/20 text-cream/30 hover:text-red-400 hover:border-red-400/40'
                    }`}
                    aria-label={
                      entry.isFavourite
                        ? `Remove ${entry.reference} from favourites`
                        : `Add ${entry.reference} to favourites`
                    }
                    title={entry.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Heart
                      className="w-4 h-4"
                      fill={entry.isFavourite ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removePassageFromCollection(collection.id, entry.key);
                    }}
                    className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/30 hover:text-red-400 hover:border-red-400/40 transition-colors flex items-center justify-center"
                    aria-label={`Remove ${entry.reference} from collection`}
                    title="Remove from collection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <CreateCollectionDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={(name, description) => {
          updateCollection(collection.id, { name, description });
        }}
        initialName={collection.name}
        initialDescription={collection.description}
        title="Edit Collection"
      />
    </div>
  );
}
