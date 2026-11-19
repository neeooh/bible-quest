# Verse card redesign

Status: first pass implemented on `feature/verse-card-redesign` (started 2026-11-16).
Mock-up: [`docs/mockups/my-verses-card.html`](mockups/my-verses-card.html) (approved as the direction).

## Why

The same thing — a Bible verse with a few actions — was designed four times, in four different ways:

| Where | File | Built from |
|---|---|---|
| Home, "Verse of the Day" | `src/pages/HomePage.tsx` | `.card` + its own markup |
| Topic pages (`/topics/:id`) | `src/pages/TopicPage.tsx` | `.card` + its own markup |
| My Verses (`/my-verses`) | `src/pages/MyVersesPage.tsx` | `.card` + its own markup |
| AI Chat carousel (`/chat/:id`) | `src/components/ai/VerseCard.tsx`, `VerseCarousel.tsx` | its own surface, nested in a wrapper |

Goal: one design, one component (`VerseCard`), used everywhere a verse is shown.

## What each card did well

- **Verse of the Day** — the best typography: upright serif, large, the verse treated as the hero.
- **Topic / My Verses** — the best layout for scanning: reference first, one primary action, quiet secondary actions.
- **Chat card** — the best structure: semantic `figure` / `blockquote` / `figcaption`, a translation tag (WEB), verse numbers for multi-verse passages.

The new card combines these: Home's typography, Topic's anatomy, Chat's semantics.

## Problems found

1. **Doubled opening quote** (`““Come to me…`) when a WEB verse itself starts with speech — the pages also wrap the text in `&ldquo;…&rdquo;`. → *Moved to `backlog.md` as a separate issue; the new card simply doesn't add quote marks.*
2. **Faux italics.** `index.html` loads Inter in upright weights only, so Topic and My Verses render browser-synthesised slanted Inter. This is why `…”` at the end of a clamped preview looks like a stray `‘`.
3. **Three scripture styles:** serif 24px upright (Home), sans 16px italic (Topic, My Verses), serif 18px with a gold left rule (Chat).
4. **Three reference styles:** sans 14px medium *below* the text (Home), Playfair 16px semibold *above* (Topic, My Verses), sans 14px semibold in a caption (Chat).
5. **Three button sizes:** 44px labelled outline (Home), 36px icon squares (Topic, My Verses — below the 44px touch target), ~32px `text-xs` outline (Chat).
6. **Inconsistent wording and concepts:** "Memorise This" (Home) vs "Practise" (Topic, My Verses) vs no primary action at all (Chat). Chat also has "Add to My Verses" as a separate idea from Favourite, while elsewhere favouriting is how a verse enters My Verses.
7. **Inconsistent surfaces:** `.card` is `navy-800` + `gold/10` border; Chat is `navy-700/50` + `gold/20` border, wrapped in another `navy-800` box (card in a card). My Verses adds a 4px left border for favourites — redundant with the filled heart, and it bends at the `rounded-xl` corners.
8. **Line length:** on desktop, Topic and My Verses run verses at ~110 characters per line. Scripture reads best at 60–70 (`max-w-[62ch]`).
9. **Contrast:** explainer text (`cream/40`, 12px) and the "Stage: Not Started" line (`cream/30`) likely fail WCAG AA.
10. **Heading-style drift:** the agreed section-label style is `text-gold-500 text-[11px] tracking-[0.2em]`, but the Verse of the Day label is still `cream/40` + `tracking-wider`.
11. **Chat carousel** is the most structurally different, not the ugliest — its verse typography is second best. It is the biggest job because the others share `.card` and need mostly type changes, whereas Chat needs layout, behaviour and action changes:
    - "Verse 1 out of 3" pager floats above the card as a separate row;
    - fake stacked-paper edges behind the card add noise;
    - no Practise/Memorise path, though chat is where people discover verses.

## Proposed solution: one `VerseCard`

### Anatomy (same everywhere)

1. **Header** — reference on the left (Playfair 600, gold, links to Read), a small `WEB` tag next to it. On the right an optional slot: an eyebrow label ("Verse of the Day"), review status ("Review due today" as a soft gold pill; "Next review Fri 21 Nov" muted), or the chat pager `‹ 1 / 3 ›`.
2. **Scripture** — Literata (a reading serif), upright, `text-cream/90`, line-height ~1.6, `max-w-[62ch]`. Superscript verse numbers when more than one verse. **No added quote marks.** Optional 2-line clamp with "Show full passage" / "Show less".
3. **Note** (optional) — explainer text or similar, `text-sm`, at least `cream/60`.
4. **Footer** — hairline divider, then:
   - left: progress (3-segment bar + "Memorising · 2 of 3"), or nothing;
   - right: quiet 40px icon buttons — Favourite, Read, ⋯ (Add to collection, Copy, Share, divider, Remove in red) — then **one** gold primary button.

### Primary action naming

Named for what happens next: **Start** (not started) → **Practise** (learning / memorising) → **Review** (due). Home's Verse of the Day uses **Memorise**.

### Variants

| Variant | Used on | Scripture | Notes |
|---|---|---|---|
| `hero` | Home | 22–24px | Eyebrow label in header; no clamp |
| `list` | Topic, My Verses, Collections | 18.5px, 2-line clamp | Progress in footer on My Verses; explainer as note on Topic |
| `cited` | Chat | 18.5px, full text | No outer wrapper; pager in header; no stacked edges |

### Colour and type rules

- Gold is reserved for: the reference, the single primary button, the "due" pill, focus rings, progress fill. Not for secondary icons or borders on hover.
- Two text levels only: 90% (scripture, labels) and 60% (secondary); 45% only for the tiny `WEB` tag and idle icons.
- Literata for scripture, Playfair for titles and references, Inter for UI.
- Favourite = filled rose heart. No coloured left borders.
- Destructive actions live in the ⋯ menu, never as a one-tap icon.

### Implementation (done on this branch)

- `src/components/verse/VerseCard.tsx` — the card. Presentational, with slots: `eyebrow`, `aside` (header right), `note`, `status` (footer left), `favourite`, `menu`, `primary`. Includes the ⋯ menu (Escape / outside click closes, arrow keys move, focus returns to the button).
- `src/components/verse/VerseStatus.tsx` — `StageProgress` (3-segment bar) and `ReviewStatus` (due pill / next review).
- `src/lib/verse-actions.ts` — `copyVerse`, `shareVerse`, `memorisePath`, `readVersePath`, `practiseLabel`.
- Literata added to `index.html`; `--font-scripture` (`font-scripture`) added to the theme in `src/index.css`.
- Pages moved onto it: Home (`hero`), Topic, My Verses, Collection detail (`list`), AI Chat (`cited` via `components/ai/VerseCard.tsx`).
- Chat carousel: stacked edges and the separate controls row removed; pager `‹ 1 / 3 ›` lives in the card header. The card is no longer re-keyed per slide, so keyboard focus stays on the pager. "Add to My Verses" removed — Favourite does that, as everywhere else. Covered by `src/components/ai/VerseCarousel.test.tsx`.

### Known gaps / next steps

- ~~**Topic previews are truncated text.**~~ Fixed: cards on Topic, My Verses and Collection pages load the full WEB text for the passage range (`src/hooks/usePassageVerses.ts`) and never show stored copies, so verses saved earlier as shortened previews (or cut at 200 characters by the practice history) now show in full too. Favouriting from a Topic page saves the full text, and My Verses reads the end verse from the stored reference so a range like Philippians 4:6–7 shows both verses.
- The chat card has not been checked in a browser with a live Ollama chat yet (unit-tested only).
- `PassagesDrawer` (chat side panel) still has its own passage rows; decide whether it should use `VerseCard` too.
- The old `.verse-number` CSS class may now be unused outside the reader — check before removing.

## Art-direction review (to revisit later)

*Written as an art-director critique of the app as a whole, 2026-11-16.*

**Verdict: competent, not beautiful yet — about 6/10.** It does not look bad; it looks safe. Navy + gold + Playfair is the default "premium devotional" look, which is exactly the problem: it could be any dark-mode Bible or meditation app. Nothing offends; nothing is memorable.

What holds it back:

- **Gold means everything, so it means nothing.** Buttons, references, labels, links, active nav, icons, borders and favourite markers are all gold. A premium accent has to be rare. Keep it for the one action we want and the reference.
- **Boxes everywhere.** Every section is the same navy rectangle with a faint gold hairline, often nested (the five progress tiles inside a card; the chat card inside a card). It reads like a form, not a book. Scripture deserves whitespace, not containers.
- **Fog.** Too much text and too many icons sit at 30–40% opacity. In screenshots this reads as murky rather than refined, and some of it fails contrast. Use two clear levels (90 / 60).
- **Playfair is overworked.** It is a display face — beautiful at 30px titles, spindly at 16px semibold references, tiring across a five-verse passage. Use a reading serif for scripture (Literata, Source Serif 4, EB Garamond), Playfair for display, Inter for UI.
- **First run is discouraging.** Under the Verse of the Day, a new user sees five zeros and "0 day streak". Before someone has started, show one inviting next step instead of a scoreboard.
- **Inconsistent page widths.** Home is a narrow centred column; Topic and My Verses run full-width with ~110-character lines. It feels like two apps.

What it gets right: a calm, coherent palette; the Verse of the Day has real presence; generous spacing on Home; nothing loud or cheap.

What would make it beautiful: let the verse be the star — a proper reading serif, upright and large, with room to breathe and sitting on the page rather than in a box; be stingy with gold; flatten the nested cards; align pages on one measure. The shared `VerseCard` is the first step, because the verse appears on almost every screen.

Follow-ups beyond the card (not in scope of this branch):

- Restrict gold usage app-wide (nav, links, icons).
- Replace the zero-state progress panel on Home with a first-step prompt.
- One content width for list pages (Topic, My Verses, Library).
- Reduce nested surfaces (progress tiles, AI panels).
- Contrast pass on all `cream/30`–`cream/40` text.

## Home page redesign (option C, "Daily ritual")

Mock-ups of the three directions: [`docs/mockups/verse-of-the-day.html`](mockups/verse-of-the-day.html). Chosen: **C** with these adjustments — keep a "Verse of the Day" label next to the date, show the streak badge only while the streak is alive, work out the "About N minutes" hint from the verse length, tune the glow separately for the light theme.

What changed and why:

- **Verse of the Day** (`src/components/home/VerseOfTheDay.tsx`) — no box; centred Literata verse with a soft gold glow behind it (`.verse-glow` in `src/index.css`, with its own light-theme colours); date · label · "Day N" streak badge; reference under the verse; one large "Memorise today's verse" button with an "About N minutes · 1 verse" hint (`memoriseMinutes()`); Favourite and Share as quiet text buttons. The `hero` size and `eyebrow` slot were removed from `VerseCard`, which is now list/cited only.
- **Streak** — the stored streak only changes on the next practice, so it can be stale; Home counts it only if the last practice was today or yesterday (`activeStreak()` in `HomePage.tsx`).
- **Your progress** (`src/components/home/ProgressSummary.tsx`) — replaces five traffic-light tiles inside a card with one segmented bar in shades of gold (most mature first), counts that link to My Verses filters, and one next step: review what's due, else start saved verses, else "all caught up". A brand-new user gets an invitation ("Start with <today's verse>", "Find verses by topic") instead of a row of zeros.
- **AI ask box** — no pulsing glow on Home (still on the new-chat screen, where it is the main focus); quieter border, left-aligned placeholder, outline arrow button.
- **Way-finding** — "Continue reading …" and "Explore the Bible" as one quiet row under progress; "About BibleQuest" last. The page is no longer vertically centred, so nothing jumps when "Continue reading" appears.

Follow-up spotted: `updateStreak()` in `src/lib/progress.ts` leaves the streak at 0 on the first day of practice and resets a broken streak to 0 instead of 1, so "Day N" reads one day short.
