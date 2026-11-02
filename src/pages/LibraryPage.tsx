import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import {
  getOldTestamentBooks,
  getNewTestamentBooks,
  type BookMeta,
} from '../lib/book-metadata';

function BookGrid({
  books,
  label,
}: {
  books: BookMeta[];
  label: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-cream">{label}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {books.map((book) => (
          <Link
            key={book.slug}
            to={`/library/${book.slug}`}
            className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer"
          >
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
    </section>
  );
}

export default function LibraryPage() {
  const otBooks = getOldTestamentBooks();
  const ntBooks = getNewTestamentBooks();

  return (
    <div className="py-10 space-y-10">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">Library</h1>
        </div>
        <p className="text-cream/40 text-sm">
          66 books &middot; World English Bible
        </p>
      </div>

      <BookGrid books={otBooks} label="Old Testament" />
      <BookGrid books={ntBooks} label="New Testament" />
    </div>
  );
}
