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

## Hosted AI: go-live checklist and server hardening

The hosted AI server (`server/`) is built and tested (16 tests), and its cost estimate matches Claude Haiku 5.5's real price ($0.10 / $0.50 per million tokens). It isn't production-ready until the items below are done. Hosting steps: README → "Hosting the AI server".

### Before going live (configuration)

- **Anthropic key, not OpenAI.** The server calls Claude through Anthropic's PHP SDK. Set `ANTHROPIC_API_KEY` from the Anthropic Console.
- **Turn on the Cloudflare Turnstile bot check (most important).** It's built but off until keys are set (`TURNSTILE_SECRET_KEY` on the server, the `VITE_TURNSTILE_SITE_KEY` repository variable for the app). Without it a script can make up unlimited "devices", so the 25-per-device limit means nothing. Only the per-network limits and the daily cap remain, and someone with many IP addresses could use up the day's $1.25 in minutes. That takes the mentor down for everyone until midnight UTC.
- **Set a monthly spend limit in the Anthropic Console** (for example $40) as the hard backstop. The server's daily cap is an estimate; the Console limit is enforced by Anthropic.
- **Check the host's PHP `max_execution_time`** (often 30 seconds). The server waits up to 60 seconds for Anthropic and retries once. If the host kills the request first, the reply is billed but never recorded, so the daily cap undercounts. Set `AI_TIMEOUT_SECONDS` below the host limit (for example 25), or raise the limit.
- **Proxies:** if Cloudflare's proxy (orange cloud) or any other proxy ever sits in front of the API, configure Laravel's trusted proxies. Otherwise every visitor shares one IP, and the 75-per-network limit becomes 75 a day for everyone combined.

### Code hardening

- **Fail closed without Turnstile in production:** when `APP_ENV=production` and no `TURNSTILE_SECRET_KEY` is set, answer "unavailable" instead of silently skipping the bot check.
- **Lower the default `AI_TIMEOUT_SECONDS` to about 25** and document it next to `max_execution_time`.
- **Add a commented-out trusted-proxy setting to `.env.example`,** with a note on when to turn it on.
- **Reserve a worst-case cost before calling Anthropic,** then settle the real cost afterwards. Today several requests arriving at once can all pass the budget check before any is recorded. The overshoot is tiny (about a tenth of a cent per reply), but reserving first closes it.
- **Deploy automation (optional):** CI tests the server but doesn't deploy it; deploys are manual.
