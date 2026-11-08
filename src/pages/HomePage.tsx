import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Flame,
  Star,
  Copy,
  ArrowRight,
  Check,
  Heart,
  Loader2,
  BookMarked,
  Share2,
  Trophy,
} from 'lucide-react';
import { getDailyVerse } from '../lib/bible';
import { getLastRead } from '../lib/last-read';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { getPassageStage } from '../lib/learning-stage';
import { showToast } from '../components/Toast';
import type { DailyVerse } from '../lib/types';

export default function HomePage() {
  const { progress } = useProgress();
  const { addVerse, isSaved, isFavourite, setFavourite, savedVerses } = useSavedVerses();
  const [copied, setCopied] = useState(false);
  const [daily, setDaily] = useState<DailyVerse | null>(null);
  const lastRead = getLastRead();

  useEffect(() => {
    getDailyVerse().then(setDaily);
  }, []);

  const dailyFavourited =
    daily !== null && isFavourite(daily.book, daily.chapter, daily.verse);

  const stageCounts = useMemo(() => {
    const seen = new Set<string>();
    let learning = 0;
    let memorising = 0;
    let retention = 0;
    let notPractised = 0;
    let dueForReview = 0;

    // Count stages from exercise history
    for (const e of progress.exerciseHistory) {
      const key = `${e.book ?? 'matthew'}:${e.chapterNumber}:${e.startVerse}-${e.endVerse}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const stage = getPassageStage(
        progress.exerciseHistory,
        e.book ?? 'matthew',
        e.chapterNumber,
        e.startVerse,
        e.endVerse,
      );
      if (stage.stage === 'learning') learning++;
      if (stage.stage === 'memorising') memorising++;
      if (stage.stage === 'retention') retention++;
      if (stage.dueForReview) dueForReview++;
    }

    // Count saved verses that have never been practised
    for (const sv of savedVerses) {
      const key = `${sv.book}:${sv.chapter}:${sv.verse}-${sv.verse}`;
      if (!seen.has(key)) {
        notPractised++;
      }
    }

    return { learning, memorising, retention, notPractised, dueForReview };
  }, [progress.exerciseHistory, savedVerses]);

  function handleCopy() {
    if (!daily) return;
    const text = `"${daily.text}" — ${daily.reference} (WEB)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Verse copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleToggleFavourite() {
    if (!daily) return;
    if (dailyFavourited) {
      setFavourite(daily.book, daily.chapter, daily.verse, false);
      showToast('Removed from favourites', 'info');
    } else {
      if (isSaved(daily.book, daily.chapter, daily.verse)) {
        setFavourite(daily.book, daily.chapter, daily.verse, true);
      } else {
        addVerse({
          book: daily.book,
          chapter: daily.chapter,
          verse: daily.verse,
          text: daily.text,
          reference: daily.reference,
        });
      }
      showToast('Added to favourites', 'success');
    }
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col justify-center space-y-12 py-8">

      {/* Daily Verse */}
      <section className="card max-w-2xl mx-auto space-y-5 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
          <Star className="w-3.5 h-3.5 text-gold-500" />
          <span className="text-cream/40">Verse of the Day</span>
        </div>

        {daily === null ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
          </div>
        ) : (
          <>
            <blockquote className="text-cream/90 text-xl md:text-2xl leading-relaxed font-serif">
              &ldquo;{daily.text}&rdquo;
            </blockquote>
            <Link
              to={`/read/${daily.book}/${daily.chapter}?verse=${daily.verse}`}
              className="text-gold-400 text-sm font-medium hover:text-gold-300 hover:underline transition-colors -mt-3 block"
            >
              {daily.reference}
            </Link>
            <div className="flex gap-2 pt-2">
              <Link
                to={`/memorize?book=${daily.book}&chapter=${daily.chapter}&start=${daily.verse}&end=${daily.verse}`}
                className="btn-gold inline-flex items-center justify-center gap-2 text-sm px-3 sm:px-6 flex-1 max-w-xs"
              >
                <BookOpen className="w-4 h-4" />
                Memorise This
              </Link>
              <button
                type="button"
                onClick={handleToggleFavourite}
                className="btn-outline inline-flex items-center justify-center gap-2 text-sm w-11 h-11 !p-0 sm:w-auto sm:h-auto sm:!px-6 sm:!py-3 shrink-0"
              >
                {dailyFavourited ? (
                  <Heart className="w-4 h-4 text-red-400" fill="currentColor" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{dailyFavourited ? 'Favourited' : 'Favourite'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-outline inline-flex items-center justify-center gap-2 text-sm w-11 h-11 !p-0 sm:w-auto sm:h-auto sm:!px-6 sm:!py-3 shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!daily) return;
                  const shareText = `"${daily.text}" — ${daily.reference} (WEB)`;
                  if (navigator.share) {
                    navigator.share({ text: shareText }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText).then(() => {
                      showToast('Copied to clipboard', 'success');
                    });
                  }
                }}
                className="btn-outline inline-flex items-center justify-center gap-2 text-sm w-11 h-11 !p-0 sm:w-auto sm:h-auto sm:!px-6 sm:!py-3 shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <section className="flex flex-wrap justify-center gap-4 items-center">
        {lastRead && (
          <Link
            to={`/read/${lastRead.book}/${lastRead.chapter}`}
            className="btn-outline inline-flex items-center gap-2 text-base px-8 py-3.5"
          >
            <BookMarked className="w-5 h-5" />
            Continue: {lastRead.bookName} {lastRead.chapter}
          </Link>
        )}
        <Link
          to="/library"
          className="text-gold-400 hover:text-gold-300 hover:underline transition-colors inline-flex items-center gap-1.5 text-sm"
        >
          Explore the Bible
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Your Progress — persistent summary card */}
      {(
        <section className="card max-w-2xl w-full mx-auto space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-cream/40">Your Progress</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-5 gap-3">
              <Link
                to="/my-verses?stage=not-started"
                className="rounded-lg bg-navy-700 hover:bg-navy-600 transition-colors p-3 group text-center col-span-2 sm:col-span-1 aspect-square flex flex-col items-center justify-center"
              >
                <p className={`text-3xl font-bold ${stageCounts.notPractised > 0 ? 'text-cream/50' : 'text-cream/20'}`}>
                  {stageCounts.notPractised}
                </p>
                <p className="text-cream/40 text-xs mt-1 group-hover:text-cream/60 transition-colors">Not Started</p>
              </Link>
              <Link
                to="/my-verses?stage=learning"
                className="rounded-lg bg-navy-700 hover:bg-navy-600 transition-colors p-3 group text-center col-span-2 sm:col-span-1 aspect-square flex flex-col items-center justify-center"
              >
                <p className="text-3xl font-bold text-blue-400">{stageCounts.learning}</p>
                <p className="text-cream/40 text-xs mt-1 group-hover:text-cream/60 transition-colors">Learning</p>
              </Link>
              <Link
                to="/my-verses?stage=memorising"
                className="rounded-lg bg-navy-700 hover:bg-navy-600 transition-colors p-3 group text-center col-span-2 sm:col-span-1 aspect-square flex flex-col items-center justify-center"
              >
                <p className="text-3xl font-bold text-amber-400">{stageCounts.memorising}</p>
                <p className="text-cream/40 text-xs mt-1 group-hover:text-cream/60 transition-colors">Memorising</p>
              </Link>
              <Link
                to="/my-verses?stage=retention"
                className="rounded-lg bg-navy-700 hover:bg-navy-600 transition-colors p-3 group text-center col-span-3 sm:col-span-1 aspect-auto sm:aspect-square flex flex-col items-center justify-center"
              >
                <p className="text-3xl font-bold text-green-400">{stageCounts.retention}</p>
                <p className="text-cream/40 text-xs mt-1 group-hover:text-cream/60 transition-colors">Retention</p>
              </Link>
              <Link
                to="/my-verses?stage=due-for-review"
                className="rounded-lg bg-navy-700 hover:bg-navy-600 transition-colors p-3 group text-center col-span-3 sm:col-span-1 aspect-auto sm:aspect-square flex flex-col items-center justify-center"
              >
                <p className={`text-3xl font-bold ${stageCounts.dueForReview > 0 ? 'text-red-400' : 'text-cream/20'}`}>
                  {stageCounts.dueForReview}
                </p>
                <p className="text-cream/40 text-xs mt-1 group-hover:text-cream/60 transition-colors">Review</p>
              </Link>
            </div>
            <Link to="/progress" className="flex items-center justify-center gap-1.5 pt-1 group">
              <Flame className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-sm font-semibold text-gold-400">{progress.dailyStreak}</span>
              <span className="text-sm text-cream/40">day streak</span>
            </Link>
          </section>
      )}

      {/* About */}
      <section className="text-center">
        <Link to="/about" className="text-cream/40 text-xs hover:text-cream/60 transition-colors">
          About BibleQuest
        </Link>
      </section>
    </div>
  );
}
