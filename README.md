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

### AI Mentor Chat (optional, local)

- Type what's on your heart into the glowing search box on the Home page (for example, "I'm feeling lonely").
- An empathetic, faith-based AI mentor replies on the **AI Chat** page and points you to Bible passages.
- Every passage it cites becomes a card with the exact World English Bible text, plus **Favourite**, **Add to My Verses** and **Read** buttons. References that don't exist are never shown as Scripture.
- Ask follow-up questions, stop a reply, or start a new chat.
- **Chat history:** your last 20 conversations are saved on this device, each at its own address (`/chat/<id>`), so refreshing or coming back from the Read page keeps you in the conversation. `/chat` (and the **AI Chat** nav link) always starts a new chat. Open **History** on the AI Chat page to reopen or delete them; recent chats also appear on the empty chat screen. You can turn history off (which deletes saved chats) in AI settings.
- **Passages panel:** see every passage from a conversation in one list and save the ones you tick to a collection.
- **AI Chat** is also in the top navigation, between Home and Library.
- If a message suggests someone may be in crisis, a fixed notice with emergency and crisis-line contacts appears.
- Runs entirely on your own Mac with [Ollama](https://ollama.com); nothing is sent to the cloud. Off by default: turn it on in **About → AI settings** (`/settings/ai`), where you can also pick the model.

### Other

- **Light and dark theme** — Toggle from the navigation bar. Scrollbars and all UI elements match the active theme.
- **PWA with offline support** — Install to your home screen with one tap. A service worker caches the app for offline use.
- **Fullscreen reading** — Enter from the Read page action bar. Persists across chapter navigation.
- **About page** — XP table, learning stage definitions, game rules, author and contact info.
- **Encouraging messages** — Accuracy scores come with motivational feedback.
- **Mobile-optimized** — Every screen is tested on small viewports. Pinch-to-zoom is disabled for an app-like feel.

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, vite-plugin-pwa. No backend. No external APIs. All data stored in LocalStorage. Optional AI features use a locally hosted Ollama server (see below).

## Getting Started

```bash
npm install
npm run dev
```

Run the unit tests (Vitest):

```bash
npm test
```

Production build:

```bash
npm run build
```

Output goes to `dist/`. Deploy as a static site.

## AI Assistant (Ollama) Setup

BibleQuest can connect to an LLM running on your own Mac with [Ollama](https://ollama.com). Nothing goes to the cloud: the browser talks directly to Ollama at `http://localhost:11434`. Design and decisions: [docs/200-local-llm-epic.md](docs/200-local-llm-epic.md).

Once Ollama is set up, open **About → AI settings**, press **Test connection**, choose a model and turn the assistant on.

Recommended model: `gemma3` (`ollama pull gemma3`).

### Local development (`npm run dev` / `npm run preview`)

No setup needed. Ollama accepts requests from `localhost` and `127.0.0.1` pages by default.

### Hosted site (https://biblequest.causewaysoft.com)

By default, Ollama refuses requests from any non-local website with **403 Forbidden**. To allow the hosted app, tell Ollama to trust its address, then restart Ollama:

```bash
launchctl setenv OLLAMA_ORIGINS "https://biblequest.causewaysoft.com"
```

Then quit Ollama from the menu bar and open it again.

Notes:

- The origin must match exactly: `https://`, no trailing slash, no path.
- Local origins (`localhost`, `127.0.0.1`) stay allowed in addition to the one you add. To allow several sites, separate them with commas.
- `launchctl setenv` is **cleared when the Mac restarts**. To make it permanent, create a Launch Agent that sets it at every login:

  ```bash
  cat > ~/Library/LaunchAgents/com.biblequest.ollama-origins.plist <<'PLIST'
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.biblequest.ollama-origins</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/launchctl</string>
      <string>setenv</string>
      <string>OLLAMA_ORIGINS</string>
      <string>https://biblequest.causewaysoft.com</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
  </dict>
  </plist>
  PLIST
  ```

- To check it worked (should print `204`, not `403`):

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS -H "Origin: https://biblequest.causewaysoft.com" -H "Access-Control-Request-Method: POST" http://localhost:11434/api/chat
  ```

- Some browsers ask for permission when a website tries to reach a service on your own computer ("local network access"). Allow it for BibleQuest.

## Bible Text

The app bundles all 66 books of the Bible from the [World English Bible](https://worldenglishbible.org/) (public domain). Each book is stored as a separate JSON file under `src/data/books/` and loaded on demand.

## Technical Debt

### My Verses list is derived from exercise history

The My Verses page builds its list by scanning `exerciseHistory` in `UserProgress`. This means the list of saved passages is not an independent data structure — it is a side effect of having practised something. Removing a passage from the list requires a `hiddenPassages` soft-delete flag instead of a simple delete, because the entry is regenerated from history on every render.

**The correct architecture:** My Verses should be its own explicit collection — a list of passage keys the user has saved or bookmarked. Exercise history should only be used to enrich those cards (accuracy, stage, last practised date), not to generate the list. Adding a passage would happen explicitly (e.g. save from the Read page, or auto-add on first practice). Removing would be a straightforward delete from the list with no flags needed. Exercise history stays as an append-only log that is never modified.

This refactor is not urgent — the current soft-delete approach works — but it should be done before adding features like archiving, re-adding removed passages, or syncing data to a backend.
