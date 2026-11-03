import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
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
} from 'lucide-react';

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

type Filter = 'all' | 'favourites' | 'due-for-review' | 'least-practised' | 'lowest-score' | 'perfect';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'favourites', label: 'Favourites' },
  { key: 'due-for-review', label: 'Due for Review' },
  { key: 'least-practised', label: 'Least Practised' },
  { key: 'lowest-score', label: 'Lowest Score' },
  { key: 'perfect', label: '100% Score' },
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
  const { savedVerses, addVerse, removeVerse, isSaved } = useSavedVerses();
  const [filter, setFilter] = useState<Filter>('all');

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
      const existing = map.get(key);
      if (existing) {
        existing.isFavourite = true;
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
          isFavourite: true,
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
        // Check if any verse in the range is saved
        for (let v = entry.startVerse; v <= entry.endVerse; v++) {
          if (isSaved(entry.book, entry.chapterNumber, v)) {
            entry.isFavourite = true;
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

    switch (filter) {
      case 'favourites':
        list = list.filter((e) => e.isFavourite);
        break;
      case 'due-for-review':
        list = list.filter((e) => e.dueForReview);
        break;
      case 'least-practised':
        list = list.sort((a, b) => a.timesCompleted - b.timesCompleted);
        return list;
      case 'lowest-score':
        list = list
          .filter((e) => e.timesCompleted > 0 && e.bestAccuracy < 0.99)
          .sort((a, b) => a.bestAccuracy - b.bestAccuracy);
        return list;
      case 'perfect':
        list = list.filter(
          (e) => e.timesCompleted > 0 && e.bestAccuracy >= 0.99,
        );
        break;
    }

    return list.sort((a, b) => b.lastPractised - a.lastPractised);
  }, [entries, filter]);

  function toggleFavourite(entry: UnifiedEntry) {
    if (entry.isFavourite) {
      // Remove all verses in the range from favourites
      for (let v = entry.startVerse; v <= entry.endVerse; v++) {
        if (isSaved(entry.book, entry.chapterNumber, v)) {
          removeVerse(entry.book, entry.chapterNumber, v);
        }
      }
    } else {
      // Add the first verse as favourite (we may not have text for ranges)
      addVerse({
        book: entry.book,
        chapter: entry.chapterNumber,
        verse: entry.startVerse,
        text: entry.text,
        reference: entry.reference,
      });
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

      {/* Filters */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-gold-500 text-navy-900'
                  : 'bg-navy-800 border border-gold-500/10 text-cream/50 hover:border-gold-500/30 hover:text-cream'
              }`}
            >
              {f.label}
            </button>
          ))}
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
              className="card flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-gold-400 font-serif font-semibold">
                    {entry.reference}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      entry.stage === 'learning'
                        ? 'bg-blue-500/15 text-blue-400'
                        : entry.stage === 'memorising'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-green-500/15 text-green-400'
                    }`}
                  >
                    {entry.stageLabel}
                  </span>
                  {entry.nextReview && (
                    <span className={`text-[10px] shrink-0 ${entry.dueForReview ? 'text-red-400 font-medium' : 'text-cream/30'}`}>
                      {entry.dueForReview ? '⏰ ' : ''}{formatReviewDate(entry.nextReview)}
                    </span>
                  )}
                </div>
                {entry.text && (
                  <p className="text-cream/60 text-sm mt-1 italic leading-relaxed line-clamp-2">
                    &ldquo;{entry.text}&rdquo;
                  </p>
                )}
                {entry.timesCompleted > 0 && (
                  <p className="text-cream/40 text-xs mt-1.5 flex items-center gap-2">
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
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/memorize?book=${entry.book}&chapter=${entry.chapterNumber}&start=${entry.startVerse}&end=${entry.endVerse}`}
                  className="btn-gold text-sm inline-flex items-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Practise
                </Link>
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
                {/* Delete: unfavourites if favourited; only removes favourites-only entries fully */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove ${entry.reference} from your list?`)) {
                      // Unfavourite if needed
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
          ))}
        </div>
      )}
    </div>
  );
}
