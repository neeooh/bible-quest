import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Copy, FolderPlus, Share2 } from 'lucide-react';
import { getTopicBySlug, TOPICS } from '../lib/topics';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { useCollections } from '../hooks/useCollections';
import TopicIcon from '../components/TopicIcon';
import AddToCollectionDialog from '../components/collections/AddToCollectionDialog';
import { showToast } from '../components/Toast';
import VerseCard from '../components/verse/VerseCard';
import { copyVerse, memorisePath, readVersePath, shareVerse } from '../lib/verse-actions';

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
      <div className="space-y-3.5">
        {topic.passages.map((passage) => {
          const isFav = isFavourite(passage.book, passage.chapter, passage.startVerse);
          const key = `${passage.book}:${passage.chapter}:${passage.startVerse}-${passage.endVerse}`;

          return (
            <VerseCard
              key={key}
              reference={passage.reference}
              readHref={readVersePath(passage.book, passage.chapter, passage.startVerse, passage.endVerse)}
              text={passage.preview}
              clamp
              note={passage.explainer}
              favourite={{ active: isFav, onToggle: () => handleToggleFavourite(passage) }}
              menu={[
                {
                  label: 'Add to collection',
                  icon: FolderPlus,
                  onSelect: () => {
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
                    setCollectionDialogKey(key);
                  },
                },
                { label: 'Copy verse', icon: Copy, onSelect: () => copyVerse(passage.preview, passage.reference) },
                { label: 'Share', icon: Share2, onSelect: () => shareVerse(passage.preview, passage.reference) },
              ]}
              primary={{
                label: 'Practise',
                to: memorisePath(passage.book, passage.chapter, passage.startVerse, passage.endVerse),
              }}
            />
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
