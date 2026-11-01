import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { bibleData } from '../lib/bible';

export default function LibraryPage() {
  const chapters = bibleData.chapters;

  return (
    <div className="py-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">Gospel of Matthew</h1>
        </div>
        <p className="text-cream/40 text-sm">
          {chapters.length} chapters &middot; World English Bible
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chapters.map(ch => {
          const preview = ch.verses
            .slice(0, 2)
            .map(v => v.text)
            .join(' ')
            .slice(0, 80);

          return (
            <Link
              key={ch.chapter}
              to={`/read/${ch.chapter}`}
              className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors">
                    Chapter {ch.chapter}
                  </h2>
                  <span className="text-xs text-cream/30">
                    {ch.verses.length} verses
                  </span>
                </div>
                <p className="text-cream/40 text-xs leading-relaxed line-clamp-2">
                  {preview}&hellip;
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
