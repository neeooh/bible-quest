import { Link } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { getBookBySlug } from '../lib/book-metadata';
import {
  BookOpen,
  Bookmark,
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

interface PassageSummary {
  book: string;
  bookName: string;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  reference: string;
  bestAccuracy: number;
  lastPractised: number;
  timesCompleted: number;
}

export default function MyVersesPage() {
  const { progress } = useProgress();
  const { savedVerses, removeVerse } = useSavedVerses();

  const passages: PassageSummary[] = (() => {
    const grouped = new Map<string, PassageSummary>();

    for (const exercise of progress.exerciseHistory) {
      const bookSlug = exercise.book ?? 'matthew';
      const bookMeta = getBookBySlug(bookSlug);
      const bookName = bookMeta?.name ?? bookSlug;
      const key = `${bookSlug}:${exercise.chapterNumber}:${exercise.startVerse}-${exercise.endVerse}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.bestAccuracy = Math.max(
          existing.bestAccuracy,
          exercise.accuracy,
        );
        existing.lastPractised = Math.max(
          existing.lastPractised,
          exercise.timestamp,
        );
        existing.timesCompleted += 1;
      } else {
        const ref =
          exercise.startVerse === exercise.endVerse
            ? `${bookName} ${exercise.chapterNumber}:${exercise.startVerse}`
            : `${bookName} ${exercise.chapterNumber}:${exercise.startVerse}–${exercise.endVerse}`;

        grouped.set(key, {
          book: bookSlug,
          bookName,
          chapterNumber: exercise.chapterNumber,
          startVerse: exercise.startVerse,
          endVerse: exercise.endVerse,
          reference: ref,
          bestAccuracy: exercise.accuracy,
          lastPractised: exercise.timestamp,
          timesCompleted: 1,
        });
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) => b.lastPractised - a.lastPractised,
    );
  })();

  return (
    <div className="py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-cream flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-gold-400" />
          My Verses
        </h1>
        <p className="text-cream/40 mt-1">
          Saved verses and passages you have practised
        </p>
      </div>

      {/* Saved Verses */}
      {savedVerses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-serif font-semibold text-cream flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold-400" />
            Saved Verses
          </h2>
          {[...savedVerses]
            .sort((a, b) => b.savedAt - a.savedAt)
            .map((sv) => (
              <div
                key={`${sv.book}:${sv.chapter}:${sv.verse}`}
                className="card flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-gold-400 font-serif font-semibold text-sm">
                    {sv.reference}
                  </p>
                  <p className="text-cream/70 text-sm mt-1 italic leading-relaxed">
                    &ldquo;{sv.text}&rdquo;
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    to={`/memorize?book=${sv.book}&chapter=${sv.chapter}&start=${sv.verse}&end=${sv.verse}`}
                    className="btn-gold text-sm"
                  >
                    Practise
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      removeVerse(sv.book, sv.chapter, sv.verse)
                    }
                    className="btn-outline text-sm inline-flex items-center gap-1.5 justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Practised Passages */}
      {passages.length > 0 && (
        <h2 className="text-lg font-serif font-semibold text-cream mt-4">
          Practised Passages
        </h2>
      )}

      {passages.length === 0 && savedVerses.length === 0 ? (
        <div className="card flex flex-col items-center text-center py-12 space-y-4">
          <BookOpen className="w-12 h-12 text-cream/25" />
          <p className="text-cream text-lg font-semibold">
            No passages practised yet.
          </p>
          <p className="text-cream/40 text-sm">
            Head to the Library to start reading and memorising.
          </p>
          <Link
            to="/library"
            className="btn-gold inline-flex items-center gap-2"
          >
            Browse Library
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {passages.map((passage) => (
            <div
              key={`${passage.book}:${passage.chapterNumber}:${passage.startVerse}-${passage.endVerse}`}
              className="card flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-gold-400 font-serif font-semibold">
                  {passage.reference}
                </p>
                <p className="text-cream/40 text-xs mt-1 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Best: {passage.bestAccuracy}% · {passage.timesCompleted}{' '}
                  sessions
                </p>
                <p className="text-cream/25 text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last practised {timeAgo(passage.lastPractised)}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  to={`/memorize?book=${passage.book}&chapter=${passage.chapterNumber}&start=${passage.startVerse}&end=${passage.endVerse}`}
                  className="btn-gold text-sm"
                >
                  Practise
                </Link>
                <Link
                  to={`/read/${passage.book}/${passage.chapterNumber}?verse=${passage.startVerse}`}
                  className="btn-outline text-sm"
                >
                  Read
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
