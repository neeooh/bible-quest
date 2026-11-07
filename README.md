# BibleQuest

> Hide His Word in your heart.

A mobile-first Bible memorization app. Read, study, and memorize Scripture through five interactive exercises, text-to-speech, and spaced repetition. Covers all 66 books of the Bible (World English Bible, public domain).

Install it as a Progressive Web App on any device for offline access.

## Features

### Bible Library

- Browse all 66 books organized by Old and New Testament.
- Each book card shows chapter count and a short introduction.
- Navigate to any chapter and verse with the passage selector.
- Search the full Bible text by keyword or phrase.

### Reading Mode

- Clean Scripture view with verse numbers and adjustable font size.
- Fullscreen mode for distraction-free reading (press Escape to exit).
- Save your reading position and resume later from the home page.
- Highlight saved verses so you can see what you have already collected.
- Copy or share any passage with one tap.
- Listen to the passage read aloud with text-to-speech.

### Five Memorization Exercises

1. **Progressive Recall** — The passage disappears across five phases. Inline fill-in inputs test your recall at each phase until you recite from memory.
2. **Missing Words** — Random words are hidden at Easy, Medium, or Hard difficulty. A per-word hint button helps when you are stuck.
3. **First Letters** — Only the first letter of each word is shown. Type the full words to rebuild the verse.
4. **Word Order** — Verse words are scrambled. Drag or tap them back into the correct order at Medium or Hard difficulty.
5. **Full Recitation** — Type or speak an entire passage from memory. Color-coded diff shows what you got right. Voice input uses the browser Speech API.

All five exercises are available from the start. Recommended exercises are highlighted based on your learning stage.

### Spaced Repetition and Learning Stages

Every saved passage moves through four stages: Not Started, Learning, Memorising, and Retention. The system schedules review intervals based on your accuracy. The home page shows how many passages are due for review.

### My Verses

- A unified list of every passage you have saved or practised.
- Filter by learning stage, favourites, lowest score, or most recent.
- Search your saved verses by reference or text.
- Practise, read, or remove any verse from one card.

### Collections

- Create named collections to group related passages (e.g., "Promises", "Psalms for Anxiety").
- Choose a Lucide icon for each collection.
- Add passages to collections from My Verses, topic pages, or the Read page.
- View a collection as its own page with all member passages.

### Topics

- Curated sets of passages organized by theme (e.g., Faith, Anxiety, Forgiveness, Lust and Sexual Self-Control).
- Browse topics from the Library page and add any passage to your list.

### Daily Verse

- A featured verse on the home page, different each day.
- Copy, share, favourite, or jump straight to memorization.

### Text-to-Speech

- Listen to any passage read aloud from the Read page or exercise screen.
- Choose from available system voices with a voice selector and test button.

### Progress Tracking

- XP earned per exercise session, weighted by accuracy.
- Daily practice streak with fire icon.
- Accuracy history per passage.
- Level system with XP thresholds.
- Progress tiles on the home page show your pipeline at a glance.

### Other

- **Light and dark theme** — Toggle from the navigation bar. Scrollbars and all UI elements match the active theme.
- **PWA with offline support** — Install to your home screen with one tap. A service worker caches the app for offline use.
- **Fullscreen reading** — Enter from the Read page action bar. Persists across chapter navigation.
- **About page** — XP table, learning stage definitions, game rules, author and contact info.
- **Encouraging messages** — Accuracy scores come with motivational feedback.
- **Mobile-optimized** — Every screen is tested on small viewports. Pinch-to-zoom is disabled for an app-like feel.

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, vite-plugin-pwa. No backend. No external APIs. All data stored in LocalStorage.

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Output goes to `dist/`. Deploy as a static site.

## Bible Text

The app bundles all 66 books of the Bible from the [World English Bible](https://worldenglishbible.org/) (public domain). Each book is stored as a separate JSON file under `src/data/books/` and loaded on demand.
