import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Heart, Loader2, Share2 } from 'lucide-react';
import type { DailyVerse } from '../../lib/types';
import { memoriseMinutes, memorisePath, readVersePath, shareVerse } from '../../lib/verse-actions';

interface VerseOfTheDayProps {
  /** null while the verse is loading. */
  daily: DailyVerse | null;
  favourite: boolean;
  onToggleFavourite: () => void;
  /** Current streak in days; the badge is hidden at 0. */
  streak: number;
}

/**
 * Home page hero ("Daily ritual", option C in docs/mockups/verse-of-the-day.html):
 * no box, centred, a soft gold glow behind the verse, and one clear action.
 */
export default function VerseOfTheDay({ daily, favourite, onToggleFavourite, streak }: VerseOfTheDayProps) {
  const [today] = useState(() => new Date());

  return (
    <section
      aria-labelledby="votd-label"
      className="verse-glow rounded-[28px] px-4 pt-10 pb-9 text-center sm:px-8 sm:pt-12 sm:pb-11"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <time dateTime={today.toISOString().slice(0, 10)} className="basis-full text-[0.82rem] font-medium tracking-[0.02em] text-cream/60 sm:basis-auto">
          {formatToday(today)}
        </time>
        <span aria-hidden="true" className="hidden h-[3px] w-[3px] rounded-full bg-cream/45 sm:block" />
        <h2 id="votd-label" className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-500">
          Verse of the Day
        </h2>
        {streak > 0 && (
          <Link
            to="/progress"
            aria-label={`${streak}-day streak`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/14 py-[3px] pr-2.5 pl-2 text-xs font-semibold text-gold-400 transition-colors hover:bg-gold-500/22"
          >
            <Flame className="h-[13px] w-[13px]" aria-hidden="true" />
            Day {streak}
          </Link>
        )}
      </div>

      {daily === null ? (
        <div className="flex min-h-[15rem] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold-500" aria-label="Loading the verse of the day" />
        </div>
      ) : (
        <>
          <blockquote className="mx-auto mt-6 max-w-[28ch] font-scripture text-[1.5rem] leading-[1.48] text-balance text-cream/92 sm:mt-7 sm:text-[1.9rem] md:text-[2.1rem]">
            {daily.text}
          </blockquote>

          <p className="mt-4 sm:mt-5">
            <Link
              to={readVersePath(daily.book, daily.chapter, daily.verse)}
              className="font-serif text-[1.06rem] font-semibold text-gold-400 underline-offset-4 decoration-1 hover:underline"
            >
              {daily.reference}
            </Link>
            <span className="ml-2 align-[2px] text-[10px] font-semibold tracking-[0.16em] text-cream/45">WEB</span>
          </p>

          <Link
            to={memorisePath(daily.book, daily.chapter, daily.verse)}
            className="btn-gold verse-glow-button mt-8 inline-flex h-[50px] w-full max-w-[20rem] items-center justify-center gap-2.5 !rounded-xl !px-[30px] !py-0 text-[0.94rem] whitespace-nowrap sm:w-auto sm:max-w-none"
          >
            Memorise today’s verse
            <ArrowRight className="h-[17px] w-[17px]" />
          </Link>
          <p className="mt-3 text-[0.78rem] text-cream/45">
            About {memoriseMinutes(daily.text)} minutes · 1 verse
          </p>

          <div className="mt-4 flex justify-center gap-6">
            <button
              type="button"
              onClick={onToggleFavourite}
              aria-pressed={favourite}
              className={`inline-flex items-center gap-[7px] px-1 py-2 text-[0.84rem] font-medium transition-colors hover:text-cream ${
                favourite ? 'text-cream' : 'text-cream/60'
              }`}
            >
              <Heart
                className={`h-[17px] w-[17px] ${favourite ? 'text-red-400' : ''}`}
                fill={favourite ? 'currentColor' : 'none'}
              />
              {favourite ? 'Favourited' : 'Favourite'}
            </button>
            <button
              type="button"
              onClick={() => shareVerse(daily.text, daily.reference)}
              className="inline-flex items-center gap-[7px] px-1 py-2 text-[0.84rem] font-medium text-cream/60 transition-colors hover:text-cream"
            >
              <Share2 className="h-[17px] w-[17px]" />
              Share
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/** "Thursday, 19 November" */
function formatToday(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('weekday')}, ${get('day')} ${get('month')}`;
}
