import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Puzzle, Layers, Mic, AlignLeft } from 'lucide-react';
import { getChapter, bibleData, getVerses } from '../lib/bible';
import { useProgress } from '../hooks/useProgress';
import type { Verse, ExerciseResult } from '../lib/types';
import MissingWords from '../components/memorize/MissingWords';
import Progressive from '../components/memorize/Progressive';
import Recitation from '../components/memorize/Recitation';
import VoiceRecitation from '../components/memorize/VoiceRecitation';

type TabKey = ExerciseResult['type'];

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'missing-words', label: 'Missing Words', icon: <Puzzle className="w-4 h-4" /> },
  { key: 'progressive', label: 'Progressive', icon: <Layers className="w-4 h-4" /> },
  { key: 'recitation', label: 'Full Recitation', icon: <AlignLeft className="w-4 h-4" /> },
  { key: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" /> },
];

export default function MemorizePage() {
  const [searchParams] = useSearchParams();
  const { recordExercise } = useProgress();
  const allChapters = bibleData.chapters;

  const paramChapter = searchParams.get('chapter');
  const paramStart = searchParams.get('start');
  const paramEnd = searchParams.get('end');

  const [selectedChapter, setSelectedChapter] = useState<number>(
    paramChapter ? Number(paramChapter) : 0,
  );
  const [startVerse, setStartVerse] = useState<number>(
    paramStart ? Number(paramStart) : 1,
  );
  const [endVerse, setEndVerse] = useState<number>(
    paramEnd ? Number(paramEnd) : 1,
  );
  const [activeTab, setActiveTab] = useState<TabKey>('missing-words');

  const chapter = selectedChapter ? getChapter(selectedChapter) : undefined;
  const maxVerse = chapter ? chapter.verses.length : 1;

  // Set defaults when chapter changes without URL params
  useEffect(() => {
    if (!paramStart && chapter) {
      setStartVerse(1);
      setEndVerse(Math.min(5, chapter.verses.length));
    }
  }, [selectedChapter, chapter, paramStart]);

  // Keep endVerse >= startVerse
  useEffect(() => {
    if (endVerse < startVerse) {
      setEndVerse(startVerse);
    }
  }, [startVerse, endVerse]);

  const verses: Verse[] = useMemo(() => {
    if (!selectedChapter) return [];
    return getVerses(selectedChapter, startVerse, endVerse);
  }, [selectedChapter, startVerse, endVerse]);

  const passageSelected = selectedChapter > 0 && verses.length > 0;

  const handleComplete = useCallback(
    (accuracy: number) => {
      const result: ExerciseResult = {
        type: activeTab,
        chapterNumber: selectedChapter,
        startVerse,
        endVerse,
        accuracy,
        xpEarned: 0,
        timestamp: Date.now(),
      };
      recordExercise(result);
    },
    [activeTab, selectedChapter, startVerse, endVerse, recordExercise],
  );

  return (
    <div className="py-10 space-y-8">
      {/* Title */}
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-gold-500" />
        <h1 className="text-3xl font-serif font-bold text-cream">Memorize</h1>
      </div>

      {/* Passage Selector */}
      <section className="card space-y-4">
        <h2 className="text-sm font-medium text-cream/50">Select a Passage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Chapter */}
          <div className="space-y-1.5">
            <label htmlFor="chapter-select" className="text-xs text-cream/40">
              Chapter
            </label>
            <select
              id="chapter-select"
              value={selectedChapter}
              onChange={e => setSelectedChapter(Number(e.target.value))}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50"
            >
              <option value={0}>Select chapter</option>
              {allChapters.map(ch => (
                <option key={ch.chapter} value={ch.chapter}>
                  Matthew {ch.chapter}
                </option>
              ))}
            </select>
          </div>

          {/* Start Verse */}
          <div className="space-y-1.5">
            <label htmlFor="start-verse" className="text-xs text-cream/40">
              Start Verse
            </label>
            <select
              id="start-verse"
              value={startVerse}
              onChange={e => setStartVerse(Number(e.target.value))}
              disabled={!selectedChapter}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
            >
              {Array.from({ length: maxVerse }, (_, i) => i + 1).map(v => (
                <option key={v} value={v}>
                  Verse {v}
                </option>
              ))}
            </select>
          </div>

          {/* End Verse */}
          <div className="space-y-1.5">
            <label htmlFor="end-verse" className="text-xs text-cream/40">
              End Verse
            </label>
            <select
              id="end-verse"
              value={endVerse}
              onChange={e => setEndVerse(Number(e.target.value))}
              disabled={!selectedChapter}
              className="w-full bg-navy-700 border border-gold-500/20 rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
            >
              {Array.from({ length: maxVerse - startVerse + 1 }, (_, i) => startVerse + i).map(
                v => (
                  <option key={v} value={v}>
                    Verse {v}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {/* Preview */}
        {passageSelected && (
          <div className="pt-2 border-t border-gold-500/10">
            <p className="text-gold-400 text-sm font-medium mb-2">
              Matthew {selectedChapter}:{startVerse}
              {startVerse !== endVerse && `–${endVerse}`}
              <span className="text-cream/30 ml-2">
                ({verses.length} verse{verses.length > 1 ? 's' : ''})
              </span>
            </p>
            <p className="text-cream/50 text-sm leading-relaxed line-clamp-3">
              {verses.map(v => v.text).join(' ')}
            </p>
          </div>
        )}
      </section>

      {/* Exercise Area */}
      {passageSelected && (
        <section className="space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gold-500 text-navy-900'
                    : 'bg-navy-800 text-cream/50 border border-gold-500/10 hover:border-gold-500/30 hover:text-cream'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active exercise */}
          <div className="card">
            {activeTab === 'missing-words' && (
              <MissingWords
                verses={verses}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
            {activeTab === 'progressive' && (
              <Progressive
                verses={verses}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
            {activeTab === 'recitation' && (
              <Recitation
                verses={verses}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
            {activeTab === 'voice' && (
              <VoiceRecitation
                verses={verses}
                chapter={selectedChapter}
                startVerse={startVerse}
                endVerse={endVerse}
                onComplete={handleComplete}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
