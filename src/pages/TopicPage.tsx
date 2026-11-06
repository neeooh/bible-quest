import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen, Heart, Brain, FolderPlus } from 'lucide-react';
import { getTopicBySlug, TOPICS } from '../lib/topics';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { useCollections } from '../hooks/useCollections';
import TopicIcon from '../components/TopicIcon';
import AddToCollectionDialog from '../components/collections/AddToCollectionDialog';
import { showToast } from '../components/Toast';

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const topic = slug ? getTopicBySlug(slug) : undefined;
  const { addVerse, isSaved, isFavourite, setFavourite } = useSavedVerses();
  const { collections, createCollection, addPassageToCollections } = useCollections();
  const [collectionDialogKey, setCollectionDialogKey] = useState<string | null>(null);

  if (!topic) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-cream/50 text-lg">Topic not found.</p>
        <Link to="/library" className="btn-outline inline-block">
          Back to Library
        </Link>
      </div>
    );
  }

  function handleToggleFavourite(passage: (typeof TOPICS)[0]['passages'][0]) {
    const isFav = isFavourite(passage.book, passage.chapter, passage.startVerse);

    if (isFav) {
      setFavourite(passage.book, passage.chapter, passage.startVerse, false);
      showToast('Removed from favourites', 'info');
    } else {
      if (isSaved(passage.book, passage.chapter, passage.startVerse)) {
        setFavourite(passage.book, passage.chapter, passage.startVerse, true);
      } else {
        addVerse({
          book: passage.book,
          chapter: passage.chapter,
          verse: passage.startVerse,
          text: passage.preview,
          reference: passage.reference,
        });
      }
      showToast('Added to favourites', 'success');
    }
  }

  return (
    <div className="py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Link
            to="/library"
            className="text-cream/40 hover:text-cream transition-colors"
            aria-label="Back to library"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0 text-gold-400">
            <TopicIcon name={topic.icon} className="w-6 h-6" />
          </span>
          <h1 className="text-3xl font-serif font-bold text-cream">
            {topic.name}
          </h1>
        </div>
        <p className="text-cream/50 text-sm leading-relaxed max-w-2xl">
          {topic.description}
        </p>
      </div>

      {/* Passage cards */}
      <div className="space-y-3">
        {topic.passages.map((passage) => {
          const isFav = isFavourite(passage.book, passage.chapter, passage.startVerse);

          return (
            <div
              key={`${passage.book}:${passage.chapter}:${passage.startVerse}`}
              className="card flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-gold-400 font-serif font-semibold text-base">
                    {passage.reference}
                  </p>
                  <span className="text-cream/25 text-xs shrink-0">
                    {passage.verseCount} verse{passage.verseCount > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-cream/60 text-sm mt-1.5 leading-relaxed line-clamp-2 font-serif">
                  {passage.preview}
                </p>
                <p className="text-cream/40 text-sm mt-2 leading-relaxed">
                  {passage.explainer}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  to={`/memorize?book=${passage.book}&chapter=${passage.chapter}&start=${passage.startVerse}&end=${passage.endVerse}`}
                  className="btn-gold text-sm inline-flex items-center justify-center gap-1.5 w-full"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Practise
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/read/${passage.book}/${passage.chapter}?verse=${passage.startVerse}`}
                    className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/40 hover:text-gold-400 hover:border-gold-500/40 transition-colors flex items-center justify-center"
                    aria-label={`Read ${passage.reference}`}
                    title="Read"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleFavourite(passage)}
                    className={`w-9 h-9 rounded-lg border transition-colors flex items-center justify-center ${
                      isFav
                        ? 'border-gold-500/30 text-red-400 hover:text-red-300'
                        : 'border-gold-500/20 text-cream/30 hover:text-red-400 hover:border-red-400/40'
                    }`}
                    aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                    title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Heart
                    className="w-4 h-4"
                    fill={isFav ? 'currentColor' : 'none'}
                  />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Ensure the passage is saved before adding to a collection
                      if (!isSaved(passage.book, passage.chapter, passage.startVerse)) {
                        addVerse({
                          book: passage.book,
                          chapter: passage.chapter,
                          verse: passage.startVerse,
                          text: passage.preview,
                          reference: passage.reference,
                          favourite: false,
                        });
                      }
                      setCollectionDialogKey(
                        `${passage.book}:${passage.chapter}:${passage.startVerse}-${passage.endVerse}`,
                      );
                    }}
                    className="w-9 h-9 rounded-lg border border-gold-500/20 text-cream/30 hover:text-gold-400 hover:border-gold-500/40 transition-colors flex items-center justify-center"
                    aria-label={`Add ${passage.reference} to collection`}
                    title="Add to collection"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AddToCollectionDialog
        isOpen={collectionDialogKey !== null}
        onClose={() => setCollectionDialogKey(null)}
        passageKey={collectionDialogKey ?? ''}
        collections={collections}
        onAddPassageToCollections={addPassageToCollections}
        onCreateCollection={createCollection}
      />
    </div>
  );
}
