# Backlog

## PWA: Add visual separator between macOS title bar and app navbar

On macOS Safari PWA installs, the OS title bar and the app navbar share the same background color (`#101827`). This creates the appearance of too much empty dark space at the top of the window.

**Fix:** Add a thin top border or gold accent line to the navbar (e.g. `border-t border-gold-500/30`) to visually separate the OS title bar from the app header.

**Why not Window Controls Overlay:** `display_override: ["window-controls-overlay"]` would eliminate the title bar entirely, but Safari (macOS and iOS) does not support it. Android does not have window chrome. WCO only works on Windows via Chrome/Edge. The accent line approach works on every platform.

## Verse text: doubled opening quote when a verse begins with speech

When a WEB verse itself starts with a quotation mark (e.g. Matthew 11:28, `“Come to me…`), pages that wrap verse text in `&ldquo;…&rdquo;` render a doubled opening quote: `““Come to me…`. Seen on the Home "Verse of the Day" card (`src/pages/HomePage.tsx`) and the Topic page previews (`src/pages/TopicPage.tsx`). The closing mark can also be missing or doubled, because WEB speech often spans several verses.

**Fix:** stop adding quote marks around scripture text, since the WEB text carries its own punctuation. If a decorative quote is wanted, draw it as a hanging glyph outside the text (`aria-hidden`), not as characters joined to the verse. Handle this as part of, or after, the shared `VerseCard` component.
