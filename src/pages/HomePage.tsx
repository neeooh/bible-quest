import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Library } from 'lucide-react';
import { getDailyVerse } from '../lib/bible';
import { getLastRead } from '../lib/last-read';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { getPassageStage } from '../lib/learning-stage';
import { showToast } from '../components/Toast';
import AiOnly from '../components/ai/AiOnly';
import AiSearchBox from '../components/ai/AiSearchBox';
import type { DailyVerse, UserProgress } from '../lib/types';
import VerseOfTheDay from '../components/home/VerseOfTheDay';
import ProgressSummary from '../components/home/ProgressSummary';

export default function HomePage() {
  const { progress } = useProgress();
  const { addVerse, isSaved, isFavourite, setFavourite, savedVerses } = useSavedVerses();
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
    <div className="mx-auto w-full max-w-2xl py-8">
      {/* AI mentor search (only when the AI assistant is enabled) */}
      <AiOnly>
        <div className="mb-10">
          <AiSearchBox />
        </div>
      </AiOnly>

      <VerseOfTheDay
        daily={daily}
        favourite={dailyFavourited}
        onToggleFavourite={handleToggleFavourite}
        streak={activeStreak(progress)}
      />

      <div className="mt-12">
        <ProgressSummary counts={stageCounts} daily={daily} />
      </div>

      {/* Way-finding */}
      <nav aria-label="Keep going" className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
        {lastRead && (
          <Link
            to={`/read/${lastRead.book}/${lastRead.chapter}`}
            className="inline-flex items-center gap-1.5 text-sm text-cream/60 transition-colors hover:text-cream"
          >
            <BookMarked className="h-[15px] w-[15px] text-gold-500" aria-hidden="true" />
            Continue reading {lastRead.bookName} {lastRead.chapter}
          </Link>
        )}
        <Link
          to="/library"
          className="inline-flex items-center gap-1.5 text-sm text-cream/60 transition-colors hover:text-cream"
        >
          <Library className="h-[15px] w-[15px] text-gold-500" aria-hidden="true" />
          Explore the Bible
        </Link>
      </nav>

      <p className="mt-7 text-center">
        <Link to="/about" className="text-xs text-cream/45 transition-colors hover:text-cream/70">
          About BibleQuest
        </Link>
      </p>
    </div>
  );
}

/**
 * The stored streak only changes when you next practise, so after a missed
 * day it is stale. Count it only while it is still alive (practised today or
 * yesterday) — same UTC dates as updateStreak().
 */
function activeStreak(progress: UserProgress): number {
  if (!progress.lastPracticeDate || progress.dailyStreak <= 0) return 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const alive = [today, yesterday].map((d) => d.toISOString().slice(0, 10));
  return alive.includes(progress.lastPracticeDate) ? progress.dailyStreak : 0;
}
