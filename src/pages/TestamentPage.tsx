import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, Info, X } from 'lucide-react';
import {
  getOldTestamentBooks,
  getNewTestamentBooks,
  type BookMeta,
} from '../lib/book-metadata';

/** Placeholder descriptions — replace with real content later. */
const BOOK_DESCRIPTIONS: Record<string, string> = {};

function getDescription(slug: string, name: string): string {
  return (
    BOOK_DESCRIPTIONS[slug] ??
    `The book of ${name}. A key part of the biblical narrative that offers wisdom, history, and spiritual insight for readers.`
  );
}

export default function TestamentPage() {
  const { testament } = useParams<{ testament: string }>();
  const isOT = testament === 'ot';
  const books: BookMeta[] = isOT
    ? getOldTestamentBooks()
    : getNewTestamentBooks();
  const label = isOT ? 'Old Testament' : 'New Testament';

  const [infoOpen, setInfoOpen] = useState<string | null>(null);

  if (testament !== 'ot' && testament !== 'nt') {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-cream/50 text-lg">Testament not found.</p>
        <Link to="/library" className="btn-outline inline-block">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Link
            to="/library"
            className="text-cream/40 hover:text-cream transition-colors"
            aria-label="Back to library"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <BookOpen className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">{label}</h1>
        </div>
        <p className="text-cream/40 text-sm">
          {books.length} books &middot; World English Bible
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {books.map((book, index) => (
          <div key={book.slug} className="relative">
            <Link
              to={`/library/${book.slug}`}
              className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer block !p-4"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl font-bold text-cream/8 font-sans leading-none shrink-0 w-6 text-right">
                  {index + 1}
                </span>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors text-sm">
                    {book.name}
                  </h3>
                  <span className="text-xs text-cream/30">
                    {book.chapterCount} chapter{book.chapterCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </Link>

            {/* Info button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInfoOpen(infoOpen === book.slug ? null : book.slug);
              }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full text-cream/15 hover:text-gold-400 hover:bg-gold-500/10 transition-colors flex items-center justify-center z-10"
              aria-label={`About ${book.name}`}
              title={`About ${book.name}`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Info tooltip */}
            {infoOpen === book.slug && (
              <div className="absolute top-0 right-0 z-20 w-64 bg-navy-800 border border-gold-500/20 rounded-xl p-4 shadow-lg shadow-navy-900/50 -translate-y-2 translate-x-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-gold-400 font-serif font-semibold text-sm">
                    {book.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setInfoOpen(null)}
                    className="text-cream/30 hover:text-cream/60 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-cream/50 text-xs leading-relaxed">
                  {getDescription(book.slug, book.name)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Click-away overlay to close info */}
      {infoOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setInfoOpen(null)}
        />
      )}
    </div>
  );
}
