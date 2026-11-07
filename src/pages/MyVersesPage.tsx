import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { useCollections } from '../hooks/useCollections';
import { toCollectionSlug } from '../lib/collections';
import { getBookBySlug } from '../lib/book-metadata';
import {
  getPassageStage,
  formatReviewDate,
  type LearningStage,
} from '../lib/learning-stage';
import {
  BookOpen,
  Bookmark,
  Brain,
  Heart,
  ArrowRight,
  Clock,
  Target,
  Trash2,
  ChevronDown,
  Search,
  X,
  FolderPlus,
  Library,
} from 'lucide-react';
import CollectionsOverview from '../components/collections/CollectionsOverview';
import CreateCollectionDialog from '../components/collections/CreateCollectionDialog';
import AddToCollectionDialog from '../components/collections/AddToCollectionDialog';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type StageFilter = 'all' | 'not-started' | 'learning' | 'memorising' | 'retention' | 'due-for-review';

const STAGE_OPTIONS: { key: StageFilter; label: string; color?: string }[] = [
  { key: 'all', label: 'All Stages' },
  { key: 'not-started', label: 'Not Started', color: 'bg-cream/30' },
  { key: 'learning', label: 'Learning', color: 'bg-blue-500' },
  { key: 'memorising', label: 'Memorising', color: 'bg-amber-500' },
  { key: 'retention', label: 'Retention', color: 'bg-green-500' },
  { key: 'due-for-review', label: 'Due for Review', color: 'bg-red-500' },
];

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
  nextReview: string | null;
  dueForReview: boolean;
}

export default function MyVersesPage() {
  const { progress } = useProgress();
  const { savedVerses, addVerse, removeVerse, setFavourite, isSaved, isFavourite } = useSavedVerses();
  const {
    collections,
    createCollection,
    deleteCollection,
    addPassageToCollections,
    removePassageFromAllCollections,
  } = useCollections();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'all-passages' | 'my-collections'>(
    searchParams.get('tab') === 'collections' ? 'my-collections' : 'all-passages',
  );
  const [stageFilter, setStageFilter] = useState<StageFilter>(() => {
    const param = searchParams.get('stage');
    if (param && STAGE_OPTIONS.some((o) => o.key === param)) return param as StageFilter;
    return 'all';
  });
  const [favouritesOnly, setFavouritesOnly] = useState(searchParams.get('filter') === 'favourites');
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [addToCollectionKey, setAddToCollectionKey] = useState<string | null>(null);

  const entries: UnifiedEntry[] = useMemo(() => {
    const map = new Map<string, UnifiedEntry>();

    // Add practised passages
    for (const exercise of progress.exerciseHistory) {
      const bookSlug = exercise.book ?? 'matthew';
      const bookMeta = getBookBySlug(bookSlug);
      const bookName = bookMeta?.name ?? bookSlug;
      const key = `${bookSlug}:${exercise.chapterNumber}:${exercise.startVerse}-${exercise.endVerse}`;

      const existing = map.get(key);
      if (existing) {
        existing.bestAccuracy = Math.max(existing.bestAccuracy, exercise.accuracy);
        existing.lastPractised = Math.max(existing.lastPractised, exercise.timestamp);
        existing.timesCompleted += 1;
        if (!existing.text && exercise.passageText) {
          existing.text = exercise.passageText;
        }
      } else {
        const ref =
          exercise.startVerse === exercise.endVerse
            ? `${bookName} ${exercise.chapterNumber}:${exercise.startVerse}`
            : `${bookName} ${exercise.chapterNumber}:${exercise.startVerse}–${exercise.endVerse}`;

        map.set(key, {
          key,
          book: bookSlug,
          bookName,
          chapterNumber: exercise.chapterNumber,
          startVerse: exercise.startVerse,
          endVerse: exercise.endVerse,
          reference: ref,
          text: exercise.passageText ?? '',
          isFavourite: false,
          bestAccuracy: exercise.accuracy,
          lastPractised: exercise.timestamp,
          timesCompleted: 1,
          stage: 'learning',
          stageLabel: 'Learning',
          nextReview: null,
          dueForReview: false,
        });
      }
    }

    // Add favourites (merge or create new entries)
    for (const sv of savedVerses) {
      const key = `${sv.book}:${sv.chapter}:${sv.verse}-${sv.verse}`;
      const isFav = sv.favourite !== false;
      const existing = map.get(key);
      if (existing) {
        if (isFav) existing.isFavourite = true;
        if (!existing.text) existing.text = sv.text;
      } else {
        map.set(key, {
          key,
          book: sv.book,
          bookName: getBookBySlug(sv.book)?.name ?? sv.book,
          chapterNumber: sv.chapter,
          startVerse: sv.verse,
          endVerse: sv.verse,
          reference: sv.reference,
          text: sv.text,
          isFavourite: isFav,
          bestAccuracy: 0,
          lastPractised: sv.savedAt,
          timesCompleted: 0,
          stage: 'learning',
          stageLabel: 'Learning',
          nextReview: null,
          dueForReview: false,
        });
      }
    }

    // Also mark favourite status for multi-verse passages by checking each verse
    for (const entry of map.values()) {
      if (!entry.isFavourite) {
        // Check if any verse in the range is favourited
        for (let v = entry.startVerse; v <= entry.endVerse; v++) {
          if (isFavourite(entry.book, entry.chapterNumber, v)) {
            entry.isFavourite = true;
            break;
          }
        }
      }
    }

    // Merge text from saved verses into entries that lack it
    for (const entry of map.values()) {
      if (!entry.text) {
        for (const sv of savedVerses) {
          if (
            sv.book === entry.book &&
            sv.chapter === entry.chapterNumber &&
            sv.verse >= entry.startVerse &&
            sv.verse <= entry.endVerse &&
            sv.text
          ) {
            entry.text = sv.text;
            break;
          }
        }
      }
    }

    // Compute stage for each entry
    for (const entry of map.values()) {
      const ps = getPassageStage(
        progress.exerciseHistory,
        entry.book,
        entry.chapterNumber,
        entry.startVerse,
        entry.endVerse,
      );
      entry.stage = ps.stage;
      entry.stageLabel = ps.label;
      entry.nextReview = ps.nextReview;
      entry.dueForReview = ps.dueForReview;
    }

    return Array.from(map.values());
  }, [progress.exerciseHistory, savedVerses, isSaved]);

  const filtered = useMemo(() => {
    let list = [...entries];

    // Apply search filter
    const needle = searchQuery.toLowerCase().trim();
    if (needle) {
      list = list.filter(
        (e) =>
          e.reference.toLowerCase().includes(needle) ||
          e.text.toLowerCase().includes(needle),
      );
    }

    // Apply stage filter
    switch (stageFilter) {
      case 'not-started':
        list = list.filter((e) => e.timesCompleted === 0);
        break;
      case 'learning':
        list = list.filter((e) => e.timesCompleted > 0 && e.stage === 'learning');
        break;
      case 'memorising':
        list = list.filter((e) => e.timesCompleted > 0 && e.stage === 'memorising');
        break;
      case 'retention':
        list = list.filter((e) => e.timesCompleted > 0 && e.stage === 'retention');
        break;
      case 'due-for-review':
        list = list.filter((e) => e.dueForReview);
        break;
    }

    // Apply favourites toggle
    if (favouritesOnly) {
      list = list.filter((e) => e.isFavourite);
    }

    return list.sort((a, b) => b.lastPractised - a.lastPractised);
  }, [entries, stageFilter, favouritesOnly, searchQuery]);

  function toggleFavourite(entry: UnifiedEntry) {
    if (entry.isFavourite) {
      // Unfavourite — keep the entry in saved verses, just toggle the flag
      for (let v = entry.startVerse; v <= entry.endVerse; v++) {
        if (isFavourite(entry.book, entry.chapterNumber, v)) {
          setFavourite(entry.book, entry.chapterNumber, v, false);
        }
      }
    } else {
      // Favourite — add or re-favourite
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

  return (
    <div className="py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-cream flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-gold-400" />
          My Verses
        </h1>
        <p className="text-cream/40 mt-1">
          Your favourites and practised passages
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('all-passages')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2 ${
            activeTab === 'all-passages'
              ? 'bg-gold-500 text-navy-900'
              : 'bg-navy-800 border border-gold-500/10 text-cream/50 hover:border-gold-500/30 hover:text-cream'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          All Passages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('my-collections')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2 ${
            activeTab === 'my-collections'
              ? 'bg-gold-500 text-navy-900'
              : 'bg-navy-800 border border-gold-500/10 text-cream/50 hover:border-gold-500/30 hover:text-cream'
          }`}
        >
          <Library className="w-4 h-4" />
          My Collections
        </button>
        {activeTab === 'my-collections' && (
          <button
            type="button"
            onClick={() => setCreateCollectionOpen(true)}
            className="btn-outline text-sm inline-flex items-center gap-2 px-4 py-2.5 sm:ml-auto"
          >
            <FolderPlus className="w-4 h-4" />
            Create Collection
          </button>
        )}
      </div>

      {activeTab === 'my-collections' ? (
        <>
          <CollectionsOverview
            collections={collections}
            onNavigateToCollection={(collectionId) => {
              const col = collections.find((c) => c.id === collectionId);
              if (col) navigate(`/my-verses/collection/${toCollectionSlug(col.name)}`);
            }}
          />
          <CreateCollectionDialog
            isOpen={createCollectionOpen}
            onClose={() => setCreateCollectionOpen(false)}
            onSave={(name, description, icon) => createCollection(name, description, icon)}
          />
        </>
      ) : (
      <>

      {/* Search */}
      {entries.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your verses..."
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

      {/* Filters */}
      {entries.length > 0 && (
        <div className="flex gap-2 items-center">
          {/* Stage dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setStageDropdownOpen((v) => !v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
                stageFilter !== 'all'
                  ? 'bg-gold-500 text-navy-900'
                  : 'bg-navy-800 border border-gold-500/10 text-cream/50 hover:border-gold-500/30 hover:text-cream'
              }`}
            >
              {STAGE_OPTIONS.find((o) => o.key === stageFilter)?.label ?? 'All Stages'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {stageDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-navy-800 border border-gold-500/20 rounded-xl p-2 shadow-lg shadow-navy-900/50 min-w-[180px]">
                {STAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStageFilter(opt.key);
                      setStageDropdownOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-navy-700 ${
                      stageFilter === opt.key ? 'text-cream' : 'text-cream/50'
                    }`}
                  >
                    {opt.color && <span className={`w-2 h-2 rounded-full ${opt.color}`} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Favourites toggle */}
          <button
            type="button"
            onClick={() => setFavouritesOnly((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
              favouritesOnly
                ? 'bg-gold-500 text-navy-900'
                : 'bg-navy-800 border border-gold-500/10 text-cream/50 hover:border-gold-500/30 hover:text-cream'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favouritesOnly ? 'fill-current' : ''}`} />
            Favourites
          </button>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="card flex flex-col items-center text-center py-12 space-y-4">
          <BookOpen className="w-12 h-12 text-cream/25" />
          <p className="text-cream text-lg font-semibold">
            No verses yet.
          </p>
          <p className="text-cream/40 text-sm">
            Favourite verses or complete exercises to build your collection.
          </p>
          <Link
            to="/library"
            className="btn-gold inline-flex items-center gap-2"
          >
            Browse Library
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-cream/40 text-sm">
            No verses match this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.key}
              className={`card flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-l-4 ${
                entry.isFavourite
                  ? 'border-l-gold-500'
                  : 'border-l-navy-600'
              }`}
            >
              <div className="min-w-0">
                {/* Identity zone: reference + metadata */}
                <div className="flex items-center gap-2">
                  <p className="text-base text-gold-400 font-serif font-semibold">
                    {entry.reference}
                  </p>
                  {entry.nextReview && (
                    <span className={`text-xs shrink-0 ${entry.dueForReview ? 'text-red-400 font-medium' : 'text-cream/30'}`}>
                      {entry.dueForReview ? '⏰ ' : ''}{formatReviewDate(entry.nextReview)}
                    </span>
                  )}
                </div>

                {/* Content zone: verse text + stats */}
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
                {/* Stage progress bar — always visible */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {(['learning', 'memorising', 'retention'] as const).map((s, i) => {
                        const stageIndex = entry.stage === 'learning' ? 0 : entry.stage === 'memorising' ? 1 : 2;
                        const isLit = entry.timesCompleted > 0 && i <= stageIndex;
                        const stageColor = entry.stage === 'learning' ? 'bg-blue-400' : entry.stage === 'memorising' ? 'bg-amber-400' : 'bg-green-400';
                        return (
                          <div
                            key={s}
                            className={`h-1.5 w-6 rounded-full ${isLit ? stageColor : 'bg-cream/10'}`}
                          />
                        );
                      })}
                    </div>
                    <span className={`text-xs ${entry.timesCompleted === 0 ? 'text-cream/25' : 'text-cream/40'}`}>
                      Stage: {entry.timesCompleted === 0 ? 'Not Started' : entry.stageLabel}
                    </span>
                  </div>
                  {entry.timesCompleted > 0 && (
                    <div className="flex items-center gap-2 text-cream/40 text-xs">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Best: {Math.round(entry.bestAccuracy * 100)}%
                      </span>
                      <span className="text-cream/20">&middot;</span>
                      <span>{entry.timesCompleted} session{entry.timesCompleted > 1 ? 's' : ''}</span>
                      {entry.lastPractised > 0 && (
                        <>
                          <span className="text-cream/20">&middot;</span>
                          <span className="flex items-center gap-1 text-cream/25">
                            <Clock className="w-3 h-3" />
                            {timeAgo(entry.lastPractised)}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto items-center sm:items-stretch">
                <Link
                  to={`/memorize?book=${entry.book}&chapter=${entry.chapterNumber}&start=${entry.startVerse}&end=${entry.endVerse}`}
                  className="btn-gold text-sm inline-flex items-center justify-center gap-1.5 w-auto sm:w-full px-3 sm:px-6"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Practise
                </Link>
                <div className="contents sm:flex sm:items-center sm:gap-2">
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
                    onClick={() => setAddToCollectionKey(entry.key)}
                    className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/30 hover:text-gold-400 hover:border-gold-500/40 transition-colors flex items-center justify-center"
                    aria-label={`Add ${entry.reference} to collection`}
                    title="Add to collection"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove ${entry.reference} from your list?`)) {
                        removePassageFromAllCollections(entry.key);
                        if (entry.isFavourite) {
                          for (let v = entry.startVerse; v <= entry.endVerse; v++) {
                            if (isSaved(entry.book, entry.chapterNumber, v)) {
                              removeVerse(entry.book, entry.chapterNumber, v);
                            }
                          }
                        }
                      }
                    }}
                    className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/30 hover:text-red-400 hover:border-red-400/40 transition-colors flex items-center justify-center"
                    aria-label={`Remove ${entry.reference}`}
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to Collection dialog */}
      <AddToCollectionDialog
        isOpen={addToCollectionKey !== null}
        onClose={() => setAddToCollectionKey(null)}
        passageKey={addToCollectionKey ?? ''}
        collections={collections}
        onAddPassageToCollections={addPassageToCollections}
        onCreateCollection={createCollection}
      />
      </>
      )}
    </div>
  );
}
