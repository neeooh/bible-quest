import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Flame,
  Trophy,
  Star,
  Copy,
  ArrowRight,
  Check,
  Heart,
  Loader2,
  BookMarked,
  Bell,
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
  const { addVerse, isSaved, isFavourite, setFavourite } = useSavedVerses();
  const [copied, setCopied] = useState(false);
  const [daily, setDaily] = useState<DailyVerse | null>(null);
  const lastRead = getLastRead();

  useEffect(() => {
    getDailyVerse().then(setDaily);
  }, []);

  const dailyFavourited =
    daily !== null && isFavourite(daily.book, daily.chapter, daily.verse);

  const hasAnyData =
    progress.totalXp > 0 ||
    progress.dailyStreak > 0 ||
    progress.chaptersExplored.length > 0 ||
    progress.passagesMemorized.length > 0;

  const dueForReviewCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
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
      if (stage.dueForReview) count++;
    }
    return count;
  }, [progress.exerciseHistory]);

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
    <div className="min-h-[calc(100vh-7rem)] flex flex-col justify-center space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4 pb-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gold-500" />
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(214,173,96,0.3)]">
          BibleQuest
        </h1>
        <p className="text-cream/50 text-lg md:text-xl font-light tracking-wide">
          Hide the words. Learn the Word.
        </p>
      </section>

      {/* Daily Verse */}
      <section className="card max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-2 text-gold-500 text-sm font-medium">
          <Star className="w-4 h-4" />
          <span>Verse of the Day</span>
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
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/memorize?book=${daily.book}&chapter=${daily.chapter}&start=${daily.verse}&end=${daily.verse}`}
                className="btn-gold inline-flex items-center gap-2 text-sm"
              >
                <BookOpen className="w-4 h-4" />
                Memorise This
              </Link>
              <button
                type="button"
                onClick={handleToggleFavourite}
                className="btn-outline inline-flex items-center gap-2 text-sm"
              >
                {dailyFavourited ? (
                  <Heart className="w-4 h-4 text-red-400" fill="currentColor" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                {dailyFavourited ? 'Favourited' : 'Favourite'}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-outline inline-flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Review nudge */}
      {dueForReviewCount > 0 && (
        <section className="max-w-2xl mx-auto">
          <Link
            to="/my-verses?filter=due-for-review"
            className="card flex items-center gap-4 group hover:border-gold-500/30 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-cream font-medium text-sm">
                {dueForReviewCount} passage{dueForReviewCount > 1 ? 's' : ''} due for review
              </p>
              <p className="text-cream/40 text-xs mt-0.5">
                Keep your memory fresh — a quick review goes a long way.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-cream/30 shrink-0 group-hover:text-amber-400 transition-colors" />
          </Link>
        </section>
      )}

      {/* CTA */}
      <section className="flex flex-wrap justify-center gap-4">
        <Link
          to="/library"
          className="btn-gold inline-flex items-center gap-2 text-base px-8 py-3.5"
        >
          Explore the Bible
          <ArrowRight className="w-5 h-5" />
        </Link>
        {lastRead && (
          <Link
            to={`/read/${lastRead.book}/${lastRead.chapter}`}
            className="btn-outline inline-flex items-center gap-2 text-base px-8 py-3.5"
          >
            <BookMarked className="w-5 h-5" />
            Continue: {lastRead.bookName} {lastRead.chapter}
          </Link>
        )}
      </section>

      {/* Quick Stats */}
      {hasAnyData ? (
        <Link to="/progress" className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto group">
          <div className="card flex items-center gap-4 group-hover:border-gold-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">{progress.totalXp}</p>
              <p className="text-cream/40 text-xs">Total XP</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 group-hover:border-gold-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">
                {progress.dailyStreak}
              </p>
              <p className="text-cream/40 text-xs">Day Streak</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 group-hover:border-gold-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">
                {progress.passagesMemorized.length}
              </p>
              <p className="text-cream/40 text-xs">Passages Memorised</p>
            </div>
          </div>
        </Link>
      ) : null}

      {/* About */}
      <section className="text-center">
        <Link to="/about" className="text-cream/20 text-xs hover:text-cream/40 transition-colors">
          About BibleQuest
        </Link>
      </section>
    </div>
  );
}
