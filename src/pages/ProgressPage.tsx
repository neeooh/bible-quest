import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Flame,
  BookOpen,
  Brain,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useProgress } from '../hooks/useProgress';
import { getBookBySlug } from '../lib/book-metadata';

const exerciseLabels: Record<string, string> = {
  'missing-words': 'Missing Words',
  'first-letters': 'First Letters',
  'word-order': 'Word Order',
  progressive: 'Progressive',
  recitation: 'Recitation',
  voice: 'Voice (legacy)',
};

/** Level title lookup — faith/Bible themed rank names */
function getLevelTitle(level: number): string {
  if (level <= 1) return 'Seeker';
  if (level <= 3) return 'Disciple';
  if (level <= 5) return 'Scribe';
  if (level <= 8) return 'Scholar';
  if (level <= 12) return 'Evangelist';
  if (level <= 17) return 'Shepherd';
  if (level <= 23) return 'Prophet';
  if (level <= 30) return 'Apostle';
  if (level <= 40) return 'Elder';
  return 'Saint';
}

/** Badge tier ring color based on level */
function getBadgeTier(level: number): { ring: string; glow: string } {
  if (level <= 3) return { ring: 'border-amber-700/60', glow: 'shadow-[0_0_20px_rgba(180,130,60,0.25)]' };
  if (level <= 8) return { ring: 'border-slate-300/60', glow: 'shadow-[0_0_20px_rgba(200,200,210,0.3)]' };
  if (level <= 17) return { ring: 'border-gold-400/70', glow: 'shadow-[0_0_24px_rgba(214,173,96,0.4)]' };
  return { ring: 'border-cyan-300/70', glow: 'shadow-[0_0_28px_rgba(140,220,255,0.4)]' };
}

export default function ProgressPage() {
  const { progress, level } = useProgress();

  const recentHistory = [...progress.exerciseHistory].reverse();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const INITIAL_COUNT = 10;
  const visibleHistory = showAllHistory ? recentHistory : recentHistory.slice(0, INITIAL_COUNT);
  const hasMore = recentHistory.length > INITIAL_COUNT;

  const levelTitle = getLevelTitle(level.level);
  const badgeTier = getBadgeTier(level.level);
  const progressPct = level.nextLevelXp > 0 ? Math.round((level.currentXp / level.nextLevelXp) * 100) : 0;
  const xpRemaining = level.nextLevelXp - level.currentXp;

  return (
    <div className="py-10 space-y-10">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-gold-500" />
        <h1 className="text-3xl font-serif font-bold text-cream">
          My Progress
        </h1>
      </div>

      {/* Level display */}
      <section className="card space-y-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            {/* Badge with tier-colored ring and shimmer animation */}
            <div className={`relative w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-gold-500/10 border-[3px] ${badgeTier.ring} flex items-center justify-center ${badgeTier.glow} overflow-hidden`}>
              <span className="text-gold-400 font-bold text-3xl sm:text-2xl relative z-10">
                {level.level}
              </span>
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
            </div>
            <div className="text-center sm:text-left">
              {/* Level title */}
              <p className="text-gold-400/70 text-xs font-semibold uppercase tracking-wider">
                {levelTitle}
              </p>
              <p className="text-cream font-semibold text-xl sm:text-lg">Level {level.level}</p>
            </div>
          </div>
          {/* XP + Streak — desktop */}
          <div className="hidden sm:flex items-center gap-4">
            {progress.dailyStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 font-semibold text-sm">
                  {progress.dailyStreak}d streak
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-gold-500" />
              <span className="text-gold-400 font-bold text-lg">
                {progress.totalXp} XP
              </span>
            </div>
          </div>
          {/* XP + Streak — mobile */}
          <div className="flex items-center justify-center gap-4 sm:hidden">
            {progress.dailyStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 font-semibold text-sm">
                  {progress.dailyStreak}d streak
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-gold-500" />
              <span className="text-gold-400 font-bold text-lg">
                {progress.totalXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar with percentage */}
        <div className="space-y-1.5">
          <div className="w-full bg-navy-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Progress stats line */}
          <div className="flex items-center justify-between text-xs text-cream/40">
            <span>{progressPct}% complete</span>
            <span>{xpRemaining} XP to next level</span>
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-gold-500" />}
          value={progress.totalXp}
          label="Total XP"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-gold-500" />}
          value={progress.dailyStreak}
          label="Day Streak"
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-gold-500" />}
          value={progress.passagesMemorized.length}
          label="Passages Memorised"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-gold-500" />}
          value={progress.chaptersExplored.length}
          label="Chapters Explored"
        />
      </section>

      {/* Exercise History */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-semibold text-cream">
          Exercise History
        </h2>
        {recentHistory.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen className="w-8 h-8 text-cream/20 mx-auto mb-3" />
            <p className="text-cream/40">No exercises completed yet.</p>
            <p className="text-cream/25 text-sm mt-1">
              Start memorising to build your history.
            </p>
            <Link
              to="/memorize"
              className="btn-gold inline-flex items-center gap-2 mt-4"
            >
              Start your first exercise
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
          <div className="space-y-2">
            {visibleHistory.map((record, idx) => {
              const bookSlug = record.book ?? 'matthew';
              const bookMeta = getBookBySlug(bookSlug);
              const bookName = bookMeta?.name ?? bookSlug;

              return (
                <div
                  key={`${record.timestamp}-${idx}`}
                  className="card flex items-center justify-between py-4"
                >
                  <div className="space-y-1">
                    <p className="text-cream text-sm font-medium">
                      {exerciseLabels[record.type] || record.type}
                    </p>
                    <p className="text-cream/40 text-xs">
                      {bookName} {record.chapterNumber}:{record.startVerse}
                      {record.startVerse !== record.endVerse &&
                        `–${record.endVerse}`}
                    </p>
                    <p className="text-cream/25 text-xs">
                      {new Date(record.timestamp).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-cream font-semibold text-sm">
                      {Math.round(record.accuracy * 100)}%
                    </p>
                    <p className="text-gold-400 text-xs font-medium">
                      +{record.xpEarned} XP
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAllHistory((v) => !v)}
              className="w-full text-center text-sm text-gold-400 hover:text-gold-300 transition-colors py-3"
            >
              {showAllHistory
                ? 'Show less'
                : `Show ${recentHistory.length - INITIAL_COUNT} more`}
            </button>
          )}
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="card flex flex-col items-center text-center gap-2 py-5">
      <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-xl font-bold text-cream">{value}</p>
      <p className="text-cream/40 text-xs">{label}</p>
    </div>
  );
}
