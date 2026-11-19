# Backlog

## PWA: Add visual separator between macOS title bar and app navbar

On macOS Safari PWA installs, the OS title bar and the app navbar share the same background color (`#101827`). This creates the appearance of too much empty dark space at the top of the window.

**Fix:** Add a thin top border or gold accent line to the navbar (e.g. `border-t border-gold-500/30`) to visually separate the OS title bar from the app header.

**Why not Window Controls Overlay:** `display_override: ["window-controls-overlay"]` would eliminate the title bar entirely, but Safari (macOS and iOS) does not support it. Android does not have window chrome. WCO only works on Windows via Chrome/Edge. The accent line approach works on every platform.

## Verse text: doubled opening quote when a verse begins with speech

When a WEB verse itself starts with a quotation mark (e.g. Matthew 11:28, `“Come to me…`), pages that wrap verse text in `&ldquo;…&rdquo;` render a doubled opening quote: `““Come to me…`. Seen on the Home "Verse of the Day" card (`src/pages/HomePage.tsx`) and the Topic page previews (`src/pages/TopicPage.tsx`). The closing mark can also be missing or doubled, because WEB speech often spans several verses.

**Fix:** stop adding quote marks around scripture text, since the WEB text carries its own punctuation. If a decorative quote is wanted, draw it as a hanging glyph outside the text (`aria-hidden`), not as characters joined to the verse. Handle this as part of, or after, the shared `VerseCard` component.

## Bug (high): daily streak reads one day short

`updateStreak()` in `src/lib/progress.ts`:

- **First day of practice:** `lastPracticeDate` is empty, so the `else` branch keeps `dailyStreak` at 0. A first practice should make the streak 1.
- **Broken streak:** when the last practice was before yesterday, the streak is reset to 0. Practising today should restart it at 1.

So every streak shown in the app ("Day N" on Home, "Nd streak" and the streak stat on My Progress) is one day short, and a new user never sees a streak on their first day.

Also, the stored streak only changes when the user next practises, so after missed days it is stale until then. Home works around this (`activeStreak()` in `src/pages/HomePage.tsx`); My Progress does not.

**Fix:** set `dailyStreak = 1` in both cases, and use one shared "active streak" helper everywhere the streak is shown. Add unit tests for: first practice, same day twice, consecutive days, a gap of 2+ days. Existing users' stored streaks will stay one short until their streak next resets, unless we add a one-off +1 migration.
