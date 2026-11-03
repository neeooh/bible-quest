import { Link } from 'react-router-dom';
import { Info, BookOpen, Brain, Puzzle, CaseSensitive, Shuffle, AlignLeft, Flame, Trophy, Star } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-10 space-y-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Info className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">About</h1>
        </div>
      </div>

      {/* What is BibleQuest */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">What is BibleQuest?</h2>
        <p className="text-cream/70 text-sm leading-relaxed">
          BibleQuest helps you memorize Scripture through interactive exercises. Read the full Bible (World English Bible), select passages, and practise them until they stick. The app works offline and tracks your progress over time.
        </p>
      </section>

      {/* How it works */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">How It Works</h2>
        <div className="space-y-3 text-cream/70 text-sm leading-relaxed">
          <p>
            <span className="text-cream font-medium">1. Pick a passage</span> — Browse the Library, search for a keyword, or select verses from the reader.
          </p>
          <p>
            <span className="text-cream font-medium">2. Practise</span> — Work through exercises that gradually remove visual clues until you can recite the passage from memory.
          </p>
          <p>
            <span className="text-cream font-medium">3. Progress through stages</span> — Each passage moves from Learning to Memorising to Retention based on your accuracy.
          </p>
          <p>
            <span className="text-cream font-medium">4. Review</span> — Passages in Retention are scheduled for spaced-repetition reviews so you do not forget them.
          </p>
        </div>
      </section>

      {/* Learning Stages */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Learning Stages</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-400 shrink-0 mt-0.5">Learning</span>
            <p className="text-cream/60 text-sm">Getting started. Fewer than 3 sessions or best accuracy below 60%.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">Memorising</span>
            <p className="text-cream/60 text-sm">Making progress. 3+ sessions with 60%+ accuracy, but recitation accuracy below 85%.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/15 text-green-400 shrink-0 mt-0.5">Retention</span>
            <p className="text-cream/60 text-sm">Memorised. Recitation accuracy 85%+. Spaced reviews keep it fresh: 1, 3, 7, 14, 30, 60, 90 days.</p>
          </div>
        </div>
      </section>

      {/* Exercises & XP */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Exercises & XP</h2>
        <p className="text-cream/50 text-sm">
          Each exercise awards XP based on difficulty. Score above 90% for a bonus +10 XP.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-500/10">
                <th className="text-left py-3 pr-4 text-cream/50 font-medium">Exercise</th>
                <th className="text-left py-3 pr-4 text-cream/50 font-medium">XP</th>
                <th className="text-left py-3 text-cream/50 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-cream/70">
              <tr className="border-b border-gold-500/5">
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Puzzle className="w-3.5 h-3.5 text-gold-500" />
                    Missing Words
                  </span>
                </td>
                <td className="py-3 pr-4 text-gold-400 font-medium">20</td>
                <td className="py-3 text-cream/50">Fill in randomly hidden words. Four difficulty levels.</td>
              </tr>
              <tr className="border-b border-gold-500/5">
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-gold-500" />
                    Word Order
                  </span>
                </td>
                <td className="py-3 pr-4 text-gold-400 font-medium">25</td>
                <td className="py-3 text-cream/50">Arrange scrambled words in the correct order.</td>
              </tr>
              <tr className="border-b border-gold-500/5">
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-gold-500" />
                    Progressive
                  </span>
                </td>
                <td className="py-3 pr-4 text-gold-400 font-medium">30</td>
                <td className="py-3 text-cream/50">Words disappear across 5 phases: 0% → 25% → 50% → 75% → 100%.</td>
              </tr>
              <tr className="border-b border-gold-500/5">
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <CaseSensitive className="w-3.5 h-3.5 text-gold-500" />
                    First Letters
                  </span>
                </td>
                <td className="py-3 pr-4 text-gold-400 font-medium">35</td>
                <td className="py-3 text-cream/50">Only the first letter of each word is shown. Reconstruct the rest.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-gold-500" />
                    Full Recitation
                  </span>
                </td>
                <td className="py-3 pr-4 text-gold-400 font-medium">50</td>
                <td className="py-3 text-cream/50">Type or speak the entire passage from memory. No clues.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Streaks & Levelling */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Streaks & Levels</h2>
        <div className="space-y-3 text-cream/70 text-sm leading-relaxed">
          <p className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-gold-500 shrink-0" />
            <span>Practise every day to build a streak. Miss a day and it resets.</span>
          </p>
          <p className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold-500 shrink-0" />
            <span>Level up by earning XP. Each level requires 100 × level XP (Level 2 = 200 XP, Level 3 = 300 XP, etc.).</span>
          </p>
          <p className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gold-500 shrink-0" />
            <span>90%+ accuracy on any exercise earns a +10 XP bonus.</span>
          </p>
        </div>
      </section>

      {/* Bible Text */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Bible Text</h2>
        <p className="text-cream/70 text-sm leading-relaxed">
          BibleQuest uses the <span className="text-cream">World English Bible (WEB)</span>, a public domain modern English translation. 66 books, 1,189 chapters, 31,098 verses — the complete Bible available offline.
        </p>
      </section>

      {/* Author & Contact */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Author</h2>
        <p className="text-cream/70 text-sm leading-relaxed">
          Built by <span className="text-cream font-medium">Your Name</span>.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href="mailto:hello@example.com"
            className="text-gold-400 hover:text-gold-300 transition-colors"
          >
            hello@example.com
          </a>
          <a
            href="https://github.com/neeooh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com/yourhandle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300 transition-colors"
          >
            Twitter / X
          </a>
        </div>
      </section>

      {/* Open Source */}
      <section className="card space-y-4">
        <h2 className="text-lg font-serif font-semibold text-cream">Open Source</h2>
        <p className="text-cream/70 text-sm leading-relaxed">
          BibleQuest is open source under the <span className="text-cream font-medium">MIT License</span>. Contributions, issues, and feedback are welcome.
        </p>
        <a
          href="https://github.com/neeooh/bible-quest"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-400 hover:text-gold-300 transition-colors text-sm inline-flex items-center gap-1.5"
        >
          github.com/neeooh/bible-quest
        </a>
        <p className="text-cream/25 text-xs">
          &copy; {new Date().getFullYear()} Your Name. Released under the MIT License.
        </p>
      </section>

      {/* Back */}
      <div className="text-center">
        <Link to="/" className="btn-outline inline-flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
