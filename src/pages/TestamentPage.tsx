import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft } from 'lucide-react';
import {
  getOldTestamentBooks,
  getNewTestamentBooks,
  type BookMeta,
} from '../lib/book-metadata';

export default function TestamentPage() {
  const { testament } = useParams<{ testament: string }>();
  const isOT = testament === 'ot';
  const books: BookMeta[] = isOT
    ? getOldTestamentBooks()
    : getNewTestamentBooks();
  const label = isOT ? 'Old Testament' : 'New Testament';

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
          <Link
            key={book.slug}
            to={`/library/${book.slug}`}
            className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer relative"
          >
            <span className="absolute top-2 left-3 text-lg font-bold text-cream/10 font-sans">
              {index + 1}
            </span>
            <div className="space-y-1.5">
              <h3 className="font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors text-sm">
                {book.name}
              </h3>
              <span className="text-xs text-cream/30">
                {book.chapterCount} chapter{book.chapterCount > 1 ? 's' : ''}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
