import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { getDailyVerse } from '../lib/bible';
import { getLastRead } from '../lib/last-read';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { showToast } from '../components/Toast';
import type { DailyVerse } from '../lib/types';

export default function HomePage() {
  const { progress } = useProgress();
  const { addVerse, isSaved } = useSavedVerses();
  const [copied, setCopied] = useState(false);
  const [daily, setDaily] = useState<DailyVerse | null>(null);
  const lastRead = getLastRead();

  useEffect(() => {
    getDailyVerse().then(setDaily);
  }, []);

  const dailySaved =
    daily !== null && isSaved(daily.book, daily.chapter, daily.verse);

  const hasAnyData =
    progress.totalXp > 0 ||
    progress.dailyStreak > 0 ||
    progress.chaptersExplored.length > 0;

  function handleCopy() {
    if (!daily) return;
    const text = `"${daily.text}" — ${daily.reference} (WEB)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Verse copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleAddToMyVerses() {
    if (!daily) return;
    addVerse({
      book: daily.book,
      chapter: daily.chapter,
      verse: daily.verse,
      text: daily.text,
      reference: daily.reference,
    });
    showToast('Added to My Verses', 'success');
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
            <blockquote className="text-cream/90 text-lg leading-relaxed font-serif italic">
              &ldquo;{daily.text}&rdquo;
            </blockquote>
            <p className="text-gold-400 text-sm font-medium">
              {daily.reference}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to={`/memorize?book=${daily.book}&chapter=${daily.chapter}&start=${daily.verse}&end=${daily.verse}`}
                className="btn-gold inline-flex items-center gap-2 text-sm"
              >
                <BookOpen className="w-4 h-4" />
                Memorise This
              </Link>
              <button
                type="button"
                onClick={handleAddToMyVerses}
                disabled={dailySaved}
                className={`btn-outline inline-flex items-center gap-2 text-sm ${dailySaved ? 'opacity-50 cursor-default' : ''}`}
              >
                {dailySaved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                {dailySaved ? 'Saved' : 'Add to My Verses'}
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

      {/* Continue Reading */}
      {lastRead && (
        <section className="max-w-2xl mx-auto">
          <Link
            to={`/read/${lastRead.book}/${lastRead.chapter}`}
            className="card flex items-center gap-4 group hover:border-gold-500/30 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0 group-hover:bg-gold-500/20 transition-colors">
              <BookMarked className="w-5 h-5 text-gold-500" />
            </div>
            <div className="min-w-0">
              <p className="text-cream/50 text-xs font-medium">Continue Reading</p>
              <p className="text-cream font-serif font-semibold group-hover:text-gold-400 transition-colors">
                {lastRead.bookName} {lastRead.chapter}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-cream/30 ml-auto shrink-0 group-hover:text-gold-400 transition-colors" />
          </Link>
        </section>
      )}

      {/* CTA */}
      <section className="text-center">
        <Link
          to="/library"
          className="btn-gold inline-flex items-center gap-2 text-base px-8 py-3.5"
        >
          Start Memorising
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Quick Stats */}
      {hasAnyData ? (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">{progress.totalXp}</p>
              <p className="text-cream/40 text-xs">Total XP</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
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
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">
                {progress.chaptersExplored.length}
              </p>
              <p className="text-cream/40 text-xs">Chapters Explored</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="max-w-2xl mx-auto">
          <div className="card text-center text-cream/50 text-sm py-6">
            Complete your first exercise to start tracking progress.
          </div>
        </section>
      )}
    </div>
  );
}
