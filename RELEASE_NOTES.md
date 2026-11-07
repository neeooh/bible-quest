# Release Notes — v2.0

**Released:** 7 November 2026
**Commits since v1:** 194
**Development window:** 2–7 November 2026

## What was v1?

v1 shipped on 1 November 2026. It was a working prototype with the Gospel of Matthew, three memorization exercises (Progressive Recall, Missing Words, Full Recitation), and basic pages for home, library, reading, memorization, and progress. It used a navy-and-gold theme and ran as a standard web app. There was no offline support, no theme toggle, and no way to organize saved passages.

## What changed in v2

### Full Bible

- Expanded from 1 book (Matthew) to all 66 books of the Bible.
- Each book loads on demand from its own JSON file.
- Every book card now shows chapter count and a short introduction written for the app.

### Two new exercises

- **First Letters** — Only the first letter of each word is shown. Type the full words to rebuild the verse.
- **Word Order** — Scrambled words at Medium or Hard difficulty. Drag or tap them into order.

All five exercises are now available from the start. The app highlights recommended exercises based on your learning stage.

### Exercise improvements

- Progressive Recall rewritten with inline fill-in inputs for phases 2–4.
- Missing Words now has named difficulty levels (Easy, Medium, Hard) and a per-word hint button.
- Full Recitation merged with the old Voice tab. Type or speak from the same screen.
- Speech-to-text converts spoken punctuation ("period", "comma") to symbols.
- The app accepts contractions and common variations as correct answers.
- Encouraging messages appear alongside accuracy scores.
- Collapsible passage selector with text preview.

### Spaced repetition and learning stages

- Every saved passage now moves through four stages: Not Started, Learning, Memorising, Retention.
- The system schedules review intervals based on accuracy.
- The home page shows how many passages are due for review.
- Context verses appear in the passage peek on the Memorise page.

### Collections

- Create named collections to group related passages.
- Choose a Lucide icon for each collection.
- Add passages from My Verses, topic pages, or the Read page.
- Each collection has its own detail page with all member passages.

### Topics

- Curated passage sets organized by theme: Faith, Anxiety, Forgiveness, Lust and Sexual Self-Control, and more.
- Browse topics from the Library page and add any passage to your saved list.

### Text-to-speech

- Listen to any passage read aloud from the Read page or the exercise screen.
- Voice selector with a test button. Defaults to Google UK English Male when available.

### Reading mode

- Fullscreen mode that persists across chapter navigation. Press Escape to exit.
- Saved verses are highlighted on the Read page with a "View in My Verses" link.
- Copy and Share buttons on the floating action bar.
- Save Reading Position button replaces auto-save.
- Continue Reading card on the home page resumes from your last chapter.

### Library and search

- Library redesigned with Old Testament and New Testament cards and a passage navigator.
- Full-text keyword and phrase search across all 66 books.
- Book cards show inline order numbers and info tooltips.

### My Verses

- Redesigned as a unified list with a search bar, favourites toggle, and learning stage filter.
- Filter by lowest score or most recent practice.
- Each card shows Practise, Read, and Remove actions on one row.

### Daily verse

- Favourite button is now a toggle.
- Share button added.
- Verse reference links to the Read page.

### Progress tracking

- Pipeline tiles on the home page: Not Started, Learning, Memorising, Retention, Review.
- Streak counter with fire icon and gold accent.
- Exercise history limited to 10 entries with Show More/Less.

### PWA and offline

- Service worker caches the app for offline use.
- One-tap install banner.
- Works on any device as a home screen app.

### Theme

- Light and dark mode toggle in the navigation bar.
- Scrollbars and all UI elements match the active theme.

### About page

- XP table, learning stage definitions, and game rules.
- Author, contact, and open-source information.

### Mobile polish

- Dozens of layout fixes for small viewports: button wrapping, dropdown positioning, card padding, filter overflow, and touch targets.
- Pinch-to-zoom disabled for an app-like feel.
- Two-tier overflow action bar on the Read page.

## Removed

- Single-book (Matthew only) data bundle replaced by per-book lazy loading.
- Voice Recitation removed as a separate tab — merged into Full Recitation.
- Auto-save reading position replaced by an explicit Save button.
- Vanity stats on the home page replaced by a persistent summary card.

## Tech

- Added vite-plugin-pwa for service worker and install support.
- 66 individual JSON files under `src/data/books/` replace the single monolithic data file.
- New hooks: `useCollections`, `useTextToSpeech`, `useInstallPrompt`, `useTheme`.
- New libraries: `learning-stage.ts`, `collections.ts`, `topics.ts`, `encouragement.ts`, `word-compare.ts`.
