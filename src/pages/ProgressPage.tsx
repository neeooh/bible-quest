import { Link } from 'react-router-dom';
import {
  Trophy,
  Flame,
  BookOpen,
  Brain,
  Target,
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
  voice: 'Voice',
};

export default function ProgressPage() {
  const { progress, level } = useProgress();

  const recentHistory = progress.exerciseHistory.slice(-20).reverse();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gold-500/10 border-2 border-gold-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(214,173,96,0.2)]">
              <span className="text-gold-400 font-bold text-2xl">
                {level.level}
              </span>
            </div>
            <div>
              <p className="text-cream font-semibold">Level {level.level}</p>
              <p className="text-cream/40 text-xs">
                {level.currentXp} / {level.nextLevelXp} XP to next level
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-gold-500" />
            <span className="text-gold-400 font-semibold">
              {progress.totalXp} XP
            </span>
          </div>
        </div>
        <div className="w-full bg-navy-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-500"
            style={{
              width: `${level.nextLevelXp > 0 ? (level.currentXp / level.nextLevelXp) * 100 : 0}%`,
            }}
          />
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          icon={<BookOpen className="w-5 h-5 text-gold-500" />}
          value={progress.chaptersExplored.length}
          label="Chapters Explored"
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-gold-500" />}
          value={progress.passagesMemorized.length}
          label="Passages Memorised"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-gold-500" />}
          value={`${Math.round(progress.bestAccuracy * 100)}%`}
          label="Best Accuracy"
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
          <div className="space-y-2">
            {recentHistory.map((record, idx) => {
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
