import { useState, useEffect, useMemo } from 'react';
import { getDailyVerse } from '../lib/bible';
import { getLastRead } from '../lib/last-read';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { getPracticeItems } from '../lib/practice-queue';
import { showToast } from '../components/Toast';
import AiOnly from '../components/ai/AiOnly';
import AiSearchBox from '../components/ai/AiSearchBox';
import type { DailyVerse, UserProgress } from '../lib/types';
import VerseOfTheDay from '../components/home/VerseOfTheDay';
import PickUpLine from '../components/home/PickUpLine';

/**
 * Home shows today, not a dashboard: the AI ask box, the Verse of the Day,
 * and at most one "pick up where you left off" line. Progress lives on
 * My Progress, the practice list on Memorise, discovery on Library.
 */
export default function HomePage() {
  const { progress } = useProgress();
  const { addVerse, isSaved, isFavourite, setFavourite, savedVerses } = useSavedVerses();
  const [daily, setDaily] = useState<DailyVerse | null>(null);
  const [lastRead] = useState(getLastRead);

  useEffect(() => {
    getDailyVerse().then(setDaily);
  }, []);

  const practice = useMemo(
    () => getPracticeItems(progress.exerciseHistory, savedVerses, progress.hiddenPassages),
    [progress.exerciseHistory, progress.hiddenPassages, savedVerses],
  );

  const dailyFavourited =
    daily !== null && isFavourite(daily.book, daily.chapter, daily.verse);

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

      <PickUpLine practice={practice} lastRead={lastRead} />
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
