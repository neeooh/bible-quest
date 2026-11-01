# BibleQuest

> Hide the words. Learn the Word.

A mobile-first Bible memorization app. Read, study, and memorize Scripture through interactive exercises and speech recognition. Launches with the complete Gospel of Matthew (28 chapters, World English Bible).

## Features

- **Bible Library** — Browse all 28 chapters. Select individual verses or ranges.
- **Reading Mode** — Clean Scripture view with verse numbers, adjustable font size, and verse highlighting.
- **Missing Words** — Random words are hidden. Type them back to test recall.
- **Progressive Memorization** — The passage gradually disappears across five phases until you recite it from memory.
- **Full Recitation** — Type an entire passage from memory. Color-coded diff shows what you got right.
- **Voice Recitation** — Speak the passage aloud. The browser Speech API transcribes and scores your accuracy.
- **Progress Tracking** — XP, daily streaks, accuracy history, and a level system. All stored in LocalStorage.
- **Daily Verse** — A featured verse on the homepage with copy and memorize buttons.

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, Lucide icons. No backend. No external APIs. Works offline after initial load.

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

The app bundles the complete Gospel of Matthew from the [World English Bible](https://worldenglishbible.org/) (public domain). The text is stored in `src/data/matthew.json`.
