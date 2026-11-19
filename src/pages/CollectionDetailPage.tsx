import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { useCollections } from '../hooks/useCollections';
import { joinVerses, usePassageVerses } from '../hooks/usePassageVerses';
import { toCollectionSlug } from '../lib/collections';
import { getBookBySlug } from '../lib/book-metadata';
import {
  getPassageStage,
  type LearningStage,
} from '../lib/learning-stage';
import { ArrowLeft, Copy, Edit, FolderMinus, FolderOpen, Search, Share2, X } from 'lucide-react';
import CreateCollectionDialog from '../components/collections/CreateCollectionDialog';
import CollectionIcon from '../components/collections/CollectionIcon';
import VerseCard from '../components/verse/VerseCard';
import { StageProgress } from '../components/verse/VerseStatus';
import { copyVerse, memorisePath, practiseLabel, readVersePath, shareVerse } from '../lib/verse-actions';

interface UnifiedEntry {
  key: string;
  book: string;
  bookName: string;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  reference: string;
  text: string;
  isFavourite: boolean;
  bestAccuracy: number;
  lastPractised: number;
  timesCompleted: number;
  stage: LearningStage;
  stageLabel: string;
}

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { savedVerses, addVerse, setFavourite, isSaved, isFavourite } = useSavedVerses();
  const {
    collections,
    updateCollection,
    deleteCollection,
    removePassageFromCollection,
  } = useCollections();

  const collection = collections.find((c) => toCollectionSlug(c.name) === slug);

  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const entries: UnifiedEntry[] = useMemo(() => {
    if (!collection) return [];

    const result: UnifiedEntry[] = [];

    for (const passageKey of collection.passageKeys) {
      const parts = passageKey.split(':');
      if (parts.length !== 3) continue;
      const bookSlug = parts[0];
      const chapterNumber = parseInt(parts[1], 10);
      const verseParts = parts[2].split('-');
      const startVerse = parseInt(verseParts[0], 10);
      const endVerse = parseInt(verseParts[1] ?? verseParts[0], 10);

      if (isNaN(chapterNumber) || isNaN(startVerse) || isNaN(endVerse)) continue;

      const bookMeta = getBookBySlug(bookSlug);
      const bookName = bookMeta?.name ?? bookSlug;

      const ref =
        startVerse === endVerse
          ? `${bookName} ${chapterNumber}:${startVerse}`
          : `${bookName} ${chapterNumber}:${startVerse}–${endVerse}`;

      // Gather stats from exercise history
      const matching = progress.exerciseHistory.filter(
        (e) =>
          (e.book ?? 'matthew') === bookSlug &&
          e.chapterNumber === chapterNumber &&
          e.startVerse === startVerse &&
          e.endVerse === endVerse,
      );

      const bestAccuracy = matching.reduce((max, e) => Math.max(max, e.accuracy), 0);
      const lastPractised = matching.reduce((max, e) => Math.max(max, e.timestamp), 0);
      const timesCompleted = matching.length;

      // Get passage text from exercise history or saved verses
      let text = '';
      for (const e of matching) {
        if (e.passageText) { text = e.passageText; break; }
      }
      if (!text) {
        for (const sv of savedVerses) {
          if (
            sv.book === bookSlug &&
            sv.chapter === chapterNumber &&
            sv.verse >= startVerse &&
            sv.verse <= endVerse &&
            sv.text
          ) {
            text = sv.text;
            break;
          }
        }
      }

      // Check favourite status
      let favourite = false;
      for (let v = startVerse; v <= endVerse; v++) {
        if (isFavourite(bookSlug, chapterNumber, v)) {
          favourite = true;
          break;
        }
      }

      const ps = getPassageStage(
        progress.exerciseHistory,
        bookSlug,
        chapterNumber,
        startVerse,
        endVerse,
      );

      result.push({
        key: passageKey,
        book: bookSlug,
        bookName,
        chapterNumber,
        startVerse,
        endVerse,
        reference: ref,
        text,
        isFavourite: favourite,
        bestAccuracy,
        lastPractised,
        timesCompleted,
        stage: ps.stage,
        stageLabel: ps.label,
      });
    }

    return result;
  }, [collection, progress.exerciseHistory, savedVerses, isFavourite]);

  // Show the full passage from the bundled Bible: stored text may be a short
  // topic preview or cut at 200 characters by the practice history.
  const ranges = useMemo(
    () =>
      entries.map((e) => ({
        key: e.key,
        book: e.book,
        chapter: e.chapterNumber,
        start: e.startVerse,
        end: e.endVerse,
      })),
    [entries],
  );
  const fullVerses = usePassageVerses(ranges);
  const fullText = (e: UnifiedEntry) => joinVerses(fullVerses.get(e.key)) ?? e.text;

  const filtered = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim();
    if (!needle) return entries;
    return entries.filter(
      (e) =>
        e.reference.toLowerCase().includes(needle) ||
        (joinVerses(fullVerses.get(e.key)) ?? e.text).toLowerCase().includes(needle),
    );
  }, [entries, fullVerses, searchQuery]);

  function toggleFavourite(entry: UnifiedEntry) {
    if (entry.isFavourite) {
      for (let v = entry.startVerse; v <= entry.endVerse; v++) {
        if (isFavourite(entry.book, entry.chapterNumber, v)) {
          setFavourite(entry.book, entry.chapterNumber, v, false);
        }
      }
    } else {
      if (isSaved(entry.book, entry.chapterNumber, entry.startVerse)) {
        setFavourite(entry.book, entry.chapterNumber, entry.startVerse, true);
      } else {
        addVerse({
          book: entry.book,
          chapter: entry.chapterNumber,
          verse: entry.startVerse,
          text: fullText(entry),
          reference: entry.reference,
        });
      }
    }
  }

  if (!collection) {
    return (
      <div className="py-10 space-y-6">
        <Link
          to="/my-verses?tab=collections"
          className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </Link>
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-cream/25 mx-auto mb-4" />
          <p className="text-cream text-lg font-semibold">Collection not found.</p>
          <p className="text-cream/40 text-sm mt-1">
            It may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 space-y-6">
      {/* Back link */}
      <Link
        to="/my-verses?tab=collections"
        className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-cream flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0 text-gold-400">
              <CollectionIcon name={collection.icon || 'BookOpen'} className="w-5 h-5" />
            </span>
            {collection.name}
          </h1>
          <p className="text-cream/40 mt-1 text-sm">
            {collection.passageKeys.length} passage{collection.passageKeys.length !== 1 ? 's' : ''}
            {collection.description && (
              <span> &middot; {collection.description}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditDialogOpen(true)}
          className="btn-outline text-sm inline-flex items-center gap-1.5 px-3 py-2 shrink-0"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {/* Search */}
      {entries.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passages..."
            className="w-full bg-navy-700 border border-gold-500/20 rounded-lg pl-10 pr-10 py-2.5 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Passage list */}
      {entries.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-cream/25 mx-auto mb-4" />
          <p className="text-cream text-lg font-semibold">No passages yet.</p>
          <p className="text-cream/40 text-sm mt-1">
            Add passages from the My Verses page.
          </p>
          <Link
            to="/my-verses"
            className="btn-gold inline-flex items-center gap-2 mt-4 text-sm"
          >
            Go to My Verses
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-cream/40 text-sm">No passages match your search.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((entry) => (
            <VerseCard
              key={entry.key}
              reference={entry.reference}
              readHref={readVersePath(entry.book, entry.chapterNumber, entry.startVerse, entry.endVerse)}
              verses={fullVerses.get(entry.key)}
              text={entry.text}
              clamp
              note={
                entry.timesCompleted > 0 ? (
                  <span className="text-[0.78rem] text-cream/45">
                    Best {Math.round(entry.bestAccuracy * 100)}% · {entry.timesCompleted} session
                    {entry.timesCompleted > 1 ? 's' : ''}
                  </span>
                ) : undefined
              }
              status={<StageProgress stage={entry.stage} started={entry.timesCompleted > 0} />}
              favourite={{ active: entry.isFavourite, onToggle: () => toggleFavourite(entry) }}
              menu={[
                { label: 'Copy verse', icon: Copy, onSelect: () => copyVerse(fullText(entry), entry.reference) },
                { label: 'Share', icon: Share2, onSelect: () => shareVerse(fullText(entry), entry.reference) },
                {
                  label: 'Remove from collection',
                  icon: FolderMinus,
                  danger: true,
                  onSelect: () => removePassageFromCollection(collection.id, entry.key),
                },
              ]}
              primary={{
                label: practiseLabel(entry.timesCompleted, false),
                to: memorisePath(entry.book, entry.chapterNumber, entry.startVerse, entry.endVerse),
              }}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <CreateCollectionDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={(name, description, icon) => {
          updateCollection(collection.id, { name, description, icon });
          // Update URL if the name (and therefore slug) changed
          const newSlug = toCollectionSlug(name);
          if (newSlug !== slug) {
            navigate(`/my-verses/collection/${newSlug}`, { replace: true });
          }
        }}
        onDelete={() => {
          if (window.confirm(`Delete "${collection.name}"? Passages will not be removed from My Verses.`)) {
            deleteCollection(collection.id);
            navigate('/my-verses?tab=collections');
          }
        }}
        initialName={collection.name}
        initialDescription={collection.description}
        initialIcon={collection.icon}
        title="Edit Collection"
      />
    </div>
  );
}
