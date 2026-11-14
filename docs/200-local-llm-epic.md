# Epic: Local LLM Assistant (Ollama)

| | |
|---|---|
| **Status** | Implemented on `feature/ai-enabled` (2026-11-14); see §11 |
| **Epic key** | `AI` (in scope: AI-0 – AI-7, AI-12.1 – AI-12.5, AI-14) |
| **Created** | 2026-11-14 |
| **Depends on** | Nothing. Independent of the My Verses refactor (see README → Technical Debt). |

---

## 1. Summary

Let BibleQuest connect to an LLM that the user runs on their own machine with [Ollama](https://ollama.com), and use its chat abilities in several parts of the app (Read, Memorise, Topics, Home).

No cloud service, no API key, no account, no backend. The app talks to Ollama straight from the browser. If Ollama is off, not configured, or out of reach, the app works and looks exactly as it does today.

## 2. Goals and non-goals

### Goals

1. A single, tested **AI platform layer** (client, settings, prompts, guardrails) that every feature reuses.
2. **Opt-in.** AI is off by default and enabled from a settings screen with a connection test.
3. **Design unchanged.** New UI is additive only (approved additions: the Home AI search box and the AI Chat page) and uses the existing tokens (`navy-*`, `gold-*`, `cream`), fonts, card styles, dialog and toast patterns. Nothing existing is restyled or moved.
4. **Scripture integrity.** The LLM never becomes a source of Bible text. Every verse shown comes from the bundled WEB JSON (this follows the rule in `prod-spec.md`).
5. **Streaming responses** with cancel, so a local model on an M1 feels responsive.

### Non-goals (this epic)

- Cloud LLM providers (OpenAI, Anthropic and so on). The client is shaped so one *could* be added later, but none ships.
- Persisting chat history across sessions, or syncing it.
- AI changing scores, XP, streaks or learning stages. Scoring stays deterministic (`word-compare.ts`).
- Running a model inside the browser (WebGPU / WebLLM).
- Any visual redesign.

## 3. Key technical constraint: how the browser reaches Ollama

This is the main risk in the epic and must be settled first (story **AI-0**).

Ollama listens on `http://localhost:11434` and exposes `/api/tags` (list models), `/api/chat` (streams newline-delimited JSON) and `/api/version`.

**Decision (2026-11-14): macOS only.** The app and Ollama run on the same Mac (M1, 16 GB). Phones and tablets are out of scope for this epic.

| Scenario | Will it work? | What's needed |
|---|---|---|
| App on the Mac via `npm run dev` / `npm run preview` (`http://localhost:5173`) → Ollama on the same Mac | Yes | Nothing. Ollama allows localhost origins by default. |
| App deployed on an HTTPS domain, opened on the **same Mac** (browser or installed PWA) | Likely, browser-dependent | `OLLAMA_ORIGINS` set to the deployed origin. Chrome may show a "local network access" permission prompt for public site → localhost requests. Safari's treatment of `http://localhost` from an HTTPS page must be checked. |
| ~~App on an iPhone/iPad~~ | Out of scope | Phones don't run Ollama locally, and reaching the Mac would need an HTTPS proxy. Revisit in a future epic if needed. |

On macOS with the Ollama desktop app, the environment is set with `launchctl setenv OLLAMA_ORIGINS "<origin>"`, then Ollama is restarted.

**Design consequence:** the Ollama base URL must be user-configurable (not hardcoded). The app must also give clear, specific errors: unreachable, CORS blocked, mixed content, no models installed, model not found.

## 4. Architecture

```
src/lib/ai/
  ollama-client.ts     fetch wrapper: version, listModels, chatStream (NDJSON), abort, timeout, typed errors
  ai-settings.ts       localStorage "biblequest-ai-settings-v1" (merge-with-defaults, same pattern as progress.ts)
  prompts.ts           one builder per feature; system prompt + grounded WEB passage text
  scripture-guard.ts   parse references in model output → validate against bundled books → link or flag
  types.ts             AiSettings, ChatMessage, AiError union
src/hooks/
  useAiSettings.ts     settings state + connection status
  useAiChat.ts         streaming state machine: idle → connecting → streaming → done | error | cancelled
src/components/ai/
  AiResponsePanel.tsx  streamed markdown-lite text, stop button, "AI-generated" label, retry
  AiActionButton.tsx   entry-point button; renders nothing when AI is disabled
  AiSetupNotice.tsx    friendly "connect your local assistant" state with a link to settings
src/pages/AiSettingsPage.tsx
```

Principles:

- **Feature code never calls `fetch` directly.** It calls `useAiChat(promptBuilder(input))`.
- **Zero new runtime dependencies.** Native `fetch`, `ReadableStream` and `TextDecoder` cover NDJSON streaming.
- **Service worker:** add a Workbox `NetworkOnly` rule for the Ollama URL pattern so AI calls are never cached, and the precache list is unchanged.
- **Offline / disabled:** `AiActionButton` returns `null` when AI is disabled. With AI enabled but unreachable, it shows `AiSetupNotice` and never blocks the core flow.

### Scripture guardrails (applies to every feature)

1. The prompt always includes the exact WEB text of the passage in question. The model is told to discuss it, not to quote other translations.
2. The model's output is shown as commentary, with a visible "AI-generated — may contain mistakes" label.
3. `scripture-guard` finds references in the output (e.g. "Romans 8:28"). It validates each one against `book-metadata` and the chapter and verse counts, then renders valid ones as links to `/read/...`. Invalid ones are shown as plain text and marked unverified.
4. When the model suggests passages (Topics), only validated references are offered, and the card preview text comes from the bundled WEB data, never from the model.

## 5. Stories

Sizes: **S** ≈ ½ day, **M** ≈ 1–2 days, **L** ≈ 3+ days.

### Milestone 0 — Discovery

#### ✅ AI-0 · Spike: Mac connectivity check (S, ~2 hours)
Confirm the browser can call Ollama in the two Mac scenarios in §3, and record the setup steps.
- **AC:** A short findings note (append to this doc) covering Chrome and Safari on the Mac against the local dev server and against the deployed site. It includes the exact `OLLAMA_ORIGINS` setup that worked, and the error each browser shows when the call is blocked (these feed the error messages in AI-2 and AI-4).
- **AC:** Confirms `/api/tags` returns both installed models with names and sizes.
- Model benchmarking is not needed: the user picks the model (see AI-4).
- No production code merged.

### Milestone 1 — Platform foundation

#### ✅ AI-1 · Test infrastructure (S)
Add Vitest (dev-only) and an `npm test` script. The repo has no tests today, and the AI layer needs them.
- **AC:** `npm test` runs in CI-like conditions with no network. One example test passes. `npm run build` is unaffected.

#### ✅ AI-2 · Ollama client (M)
`src/lib/ai/ollama-client.ts` with `getVersion`, `listModels`, `chatStream(messages, { model, signal, options })`.
- **AC:** Parses NDJSON chunks across arbitrary byte boundaries. Yields text deltas, and ends on `done: true`.
- **AC:** `AbortSignal` cancels mid-stream without an unhandled rejection.
- **AC:** Typed errors: `unreachable` (covers both "Ollama not running" and "blocked by CORS", because the browser reports both as the same `TypeError: Failed to fetch`; see AI-0 findings), `model_not_found` (HTTP 404), `timeout`, `bad_response`, `aborted`. The `unreachable` message lists both likely causes and the fix for each.
- **AC:** Unit tests cover chunk splitting, errors and abort with a mocked `fetch`.

#### ✅ AI-3 · AI settings store and hook (S)
`ai-settings.ts` + `useAiSettings`: `enabled` (default `false`), `baseUrl` (default `http://localhost:11434`), `model`, `temperature`.
- **AC:** Follows the merge-with-defaults loading pattern from `progress.ts` (see commit `c5877c7`).
- **AC:** Corrupt or missing storage falls back to defaults. Unit tested.

#### ✅ AI-4 · AI settings page (M)
New route `/settings/ai`, linked from the About page and from `AiSetupNotice` (§9 Q2). Toggle, base URL field, **Test connection** button, model dropdown filled from `/api/tags`, short setup help (from AI-0 findings).
- **AC:** Test connection shows the Ollama version or a specific, human-readable error from AI-2.
- **AC:** A **model dropdown** lists every model installed in Ollama (live from `/api/tags`, with name and size). The user's choice is saved and used by every AI feature. There is no hardcoded model list: models added later with `ollama pull` appear after a refresh.
- **AC:** First run with no saved choice → `gemma3` is preselected if installed (any tag, e.g. `gemma3:latest`); otherwise the first installed model.
- **AC:** If the saved model is no longer installed, the settings page shows it as missing and asks the user to pick another. AI features show `AiSetupNotice` instead of failing.
- **AC:** Empty list → "Run `ollama pull <model>`" hint.
- **AC:** Matches existing page styling in dark and light themes and at 375px width. No changes to existing pages besides the agreed entry link.

#### ✅ AI-5 · Streaming chat hook and UI primitives (M)
`useAiChat`, `AiResponsePanel`, `AiActionButton`, `AiSetupNotice`.
- **AC:** Text streams in progressively. A Stop button cancels. Retry re-runs the same prompt.
- **AC:** With AI disabled, `AiActionButton` renders nothing (verified: no DOM output).
- **AC:** Accessible: `aria-live="polite"` on the response region, and keyboard-operable controls.
- **AC:** Panel unmount aborts the request.

#### ✅ AI-6 · Prompt library and scripture guard (M)
`prompts.ts` (one builder per feature, versioned) and `scripture-guard.ts`.
- **AC:** Every builder injects the WEB passage text and reference. Snapshot tests per builder.
- **AC:** The guard handles common forms ("John 3:16", "1 Cor 13:4-7", "Ps. 23", en-dashes, book abbreviations). It rejects out-of-range chapters and verses. Unit tested against `book-metadata`.

#### ✅ AI-7 · PWA and service-worker rules (S)
- **AC:** AI requests are never handled or cached by the service worker. *(Implemented 2026-11-14: no Workbox route matches Ollama requests, so the browser sends them straight to the network; verified in a production build with the service worker active. A `NetworkOnly` rule was not added because routing streams through the worker adds risk to streaming and cancel with no benefit.)*
- **AC:** No change to the manifest, icons or precache contents.

### Milestone 2 — (parked)

> **Decision (2026-11-14):** AI-8 is **parked**; AI Chat (AI-12) covers similar ground and becomes the first feature after the foundation.

#### ⏸ AI-8 (parked) · Read page: "Ask about this passage" (M)
Add an AI action inside the existing verse-selection bar's "More actions" menu (§9 Q3). It opens a sheet with quick prompts — *Explain this*, *Historical context*, *How does this apply today?* — plus a free-text follow-up box.
- **AC:** Uses the selected verses' WEB text as grounding. Follow-up questions keep the conversation in memory for that sheet only.
- **AC:** References in answers are validated and linked by AI-6.
- **AC:** Fullscreen reading mode is unaffected.

### Milestone 3 — More features

> **Decision (2026-11-14):** AI-12 is the only Milestone 3 feature in scope. AI-9, AI-10, AI-11 and AI-13 are **parked**: kept here for reference, not planned.

#### ⏸ AI-9 (parked) · Memorise: memory aid (M)
On `MemorizePage`, an "AI memory tip" action. It suggests chunking, a mnemonic or imagery for the current passage.
- **AC:** Never reveals the passage in a way that defeats the active exercise (the prompt forbids restating the full text, and the tip is shown before or after the exercise, not during scoring).
- **AC:** No effect on XP or stage.

#### ⏸ AI-10 (parked) · Recitation: explain my mistakes (M)
After Full Recitation / Voice Recitation, an optional "Explain my mistakes" button. It sends the deterministic diff from `word-compare` (not raw free text) and returns friendly guidance, e.g. "you swapped 'faith' and 'hope'; the order follows…".
- **AC:** The accuracy score shown is still the deterministic one. AI output is advisory only.

#### ⏸ AI-11 (parked) · Missing Words: meaning-based hint (S)
An optional second hint level that gives a clue to the word's meaning without the word itself (the existing letter hint stays unchanged).
- **AC:** If the model's hint contains the target word, it is rejected and the existing hint is used instead.
- **AC:** Using an AI hint counts as a hint in scoring, exactly like today's hint.

#### ✅ AI-12 · AI Chat: faith-based mentor (L, split into AI-12.1 – AI-12.5)

> **Redesigned 2026-11-14** from "Find passages about…" into a chat feature.

**User story.** As a user, I type what's on my heart (e.g. *"I'm feeling lonely"*) into a search box on the Home page. I land on an **AI Chat** page where an empathetic, faith-based mentor answers in a conversational way and points me to Bible passages. Each passage it mentions appears as a highlighted quote with the real WEB text, plus buttons to favourite it, add it to My Verses, or open it on the Read page. I can keep chatting with follow-up questions.

**How verses get into the chat.** The model is told to *cite* references (e.g. "Psalm 34:18") but not to write out the verse text. The app detects each reference with the scripture guard (AI-6, regex-based, works while text is streaming). It validates the reference against the bundled Bible and renders a verse card underneath using the **real WEB text**. References that don't exist are shown as plain text, with no card. This keeps the "never show model-generated Scripture" rule (§4). Ollama's JSON mode is not used here, because it doesn't suit a streamed, conversational answer.

##### ✅ AI-12.1 · Home page AI search box (S)
- A search box on the Home page with an animated, glowing shadow in the brand gold (`gold-500`). It respects `prefers-reduced-motion` (glow stays, animation stops) and works in both themes.
- **Enter** or the search button navigates to `/chat` and passes the query in router state, not in the URL, so private queries don't end up in browser history.
- Shown only when AI is enabled in settings. When AI is disabled, the Home page is unchanged.
- Empty query → nothing happens.

##### ✅ AI-12.2 · AI Chat page (M)
- New route `/chat` ("AI Chat"), built from existing tokens and card styles. The navbar is unchanged; the page is reached from the Home search box.
- The first message is the query from the Home page, sent automatically. A text box at the bottom handles follow-ups (Enter sends, Shift+Enter adds a new line).
- Messages appear as a simple thread (your message / mentor reply). Replies stream in, with Stop and Retry (AI-5).
- "New chat" clears the conversation.
- The current conversation is kept in `sessionStorage` (§9 Q6). It survives going to the Read page and back, and a page refresh. It is cleared by **New chat** or by closing the tab. No long-term history in the MVP.
- With AI disabled or unreachable, the page shows `AiSetupNotice`.

##### ✅ AI-12.3 · Mentor persona and safety (M)
- A versioned system prompt (AI-6): warm, empathetic, non-judgemental, grounded in Scripture. It cites 1–4 passages per reply, never writes out verse text, and keeps replies short enough to read on one screen.
- The prompt tells the mentor that it is not a pastor, counsellor or doctor, and to gently suggest talking to trusted people or a professional when appropriate.
- **Crisis safety:** if the message suggests self-harm, suicide, abuse or danger, the app shows a fixed (not AI-generated) notice above the reply. It encourages contacting local emergency services or a crisis line, alongside the mentor's response.
- A small, always-visible line on the page: "AI-generated guidance, may contain mistakes. Prompts stay on your Mac."
- **AC:** Prompt snapshot tests; crisis-keyword detection unit tested.

##### ✅ AI-12.4 · Verse detection and verse cards (M)
- Uses the scripture guard (AI-6) on streamed text: references become highlighted links and get a quote card. A card appears once its reference is complete in the stream.
- Ranges ("Romans 8:38–39") render as one card with all verses.
- Card text always comes from the bundled WEB data, loaded with the existing `getVerses`.
- Each card has three actions, reusing existing logic:
  - **Favourite**: `addSavedVerse(s)` with `favourite: true` / `setVerseFavourite`.
  - **Add to My Verses**: `addSavedVerses` with `favourite: false`.
  - **Read**: navigate to `/read/:book/:chapter` with the verses highlighted.
- Buttons show the current state (already favourited / already in My Verses), using the existing Toast for confirmation.
- **AC:** Invalid references show no card. Duplicate references in one reply produce one card.
- **AC:** Models quote verse text even when told not to, and sometimes invent the wording (AI-0 findings). When a quoted passage sits next to a detected reference, the app renders the quote in plain text (not styled as Scripture). The real WEB text appears only in the verse card, so a made-up quote is never presented as the Bible.

##### ✅ AI-12.5 · Chat QA (S)
- Manual test script: 10 realistic queries (loneliness, anxiety, grief, guilt, temptation…) run against both installed models. For each: are references real, relevant and not invented? Is the tone right? Results recorded in this doc.
- **AC:** No model-generated verse text appears anywhere; crisis notice appears for crisis test phrases.

#### ⏸ AI-12.6 (parked, high priority next) · Save chat passages as a collection (S)
A "Save these passages as a collection" button on the chat. It creates a collection (named from the first query) containing every valid passage from the conversation, using the existing Collections feature. To be done soon after the MVP.

#### ⏸ AI-12.7 (parked, next after AI-12.6) · Saved chat history (S)
Save recent chats on the device so the user can return to a helpful conversation.
- A "Recent chats" list on the chat page: reopen, delete one, or clear all.
- Stored in localStorage as text only (references, not verse text; cards are rebuilt from the bundled WEB data). Capped at the 20 most recent chats.
- A "Save chat history" switch in AI settings (on by default), with a note that chats are stored unencrypted on this device. Turning it off deletes saved chats after a confirmation.

#### ⏸ AI-13 (parked) · Home: daily verse reflection (S)
Optional "Reflect" action on the Daily Verse card: a short reflection and one question to think about.
- **AC:** Cached per day in memory, so re-renders don't re-prompt. The card layout is unchanged when AI is disabled.

### Milestone 4 — Hardening and release

#### ✅ AI-14 · Docs, QA and release (S)
- **AC:** README: replace "No external APIs" with an accurate note on the optional local AI, and add an "AI Assistant (Ollama)" setup section based on AI-0.
- **AC:** About page gets a short privacy note: prompts go only to the user's own Ollama server.
- **AC:** `RELEASE_NOTES.md` updated.
- **AC:** Full regression pass with AI **disabled**: every existing screen behaves exactly as before.
- **AC:** Manual test matrix (dark/light × desktop/375px × Chrome/Safari × AI on/off/unreachable).

## 6. Sequencing

```
AI-0 ─► AI-1 ─► AI-2 ─► AI-3 ─► AI-4
                  │                │
                  └► AI-5 ◄────────┘
                  └► AI-6
         AI-7 (any time after AI-2)
                    ▼
                 AI-12 (12.1 → 12.5)  ─►  AI-14  ── release checkpoint ──►  AI-12.6 ─► AI-12.7
```

Rough total: about 12–16 working days for one developer: foundation (AI-0 – AI-7) about 5–7 days, AI Chat (AI-12.1 – 12.5) about 6–8 days, release (AI-14) about 1 day.

## 7. Workflow and definition of done

- One branch and one PR per story: `feat/ai-<n>-<slug>`, with conventional commits (`feat:`, `fix:`, `docs:`, `test:`) matching repo history.
- **Definition of done** for every story:
  - `npm run build` (tsc + vite) and `npm run lint` pass. `npm test` passes once AI-1 has landed.
  - Acceptance criteria met and checked manually in both themes and at 375px.
  - With AI disabled, there is no visible change to existing screens.
  - No new runtime dependencies without an explicit decision.
  - Docs updated where behaviour changed.

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Browser blocks localhost calls from the deployed HTTPS site | AI works only via the local dev server | AI-0 spike first; configurable base URL; `OLLAMA_ORIGINS` setup guide |
| Small local models hallucinate references or doctrine | Trust | Scripture guard, grounding, "AI-generated" label, verse text always from WEB |
| Slow responses with a large model the user selects | UX | Streaming, Stop button; model size shown in the dropdown |
| AI tips undermine memorisation (giving away answers) | Learning quality | Prompt rules plus output checks (AI-9, AI-11) |
| Scope creep into redesign | Constraint breach | "Additive only" rule in DoD; entry points reviewed in §9 |

## 9. Open decisions (need your input)

1. ~~**Supported scenarios.**~~ **Decided:** macOS only. Phones are out of scope (§3).
2. ~~**Settings entry point.**~~ **Decided:** a link on the About page, plus a link inside each `AiSetupNotice`. The navbar is untouched.
3. ~~**Read page placement.**~~ **Decided:** the AI action goes inside the existing "More actions" menu.
4. ~~**Default model.**~~ **Decided:** `gemma3` is the default (preselected when installed). The user can pick any installed model from the dropdown (AI-4).
5. ~~**Milestone 3 priority.**~~ **Decided:** AI-12 only, redesigned as AI Chat; the others are parked. Saving chat passages as a collection (AI-12.6) is parked but next in line.
6. ~~**Chat history.**~~ **Decided:** MVP keeps the current chat for the browser session only (AI-12.2). Saved history is a parked follow-up (AI-12.7).
7. ~~**AI-8.**~~ **Decided:** parked. AI-12 is the first feature after the foundation.

## 10. AI-0 findings (2026-11-14)

**Setup tested:** MacBook Pro M1, 16 GB RAM, Ollama 0.40.16 (desktop app), no `OLLAMA_ORIGINS` / `OLLAMA_HOST` set. Browser: Chromium 156 (the Claude desktop app's built-in browser), with the app on the Vite dev server (`http://localhost:5174`).

### Connectivity

| Check | Result |
|---|---|
| `GET /api/tags` from the app page | ✅ Works |
| Streaming `POST /api/chat` (NDJSON) from the app page | ✅ Works; chunks parse cleanly with `ReadableStream` + `TextDecoder` |
| `AbortController` cancel mid-stream | ✅ Rejects with `AbortError` |
| CORS preflight for `http://localhost:*` and `http://127.0.0.1:*` | ✅ Allowed by default (204, `Access-Control-Allow-Origin` echoes the origin) |
| CORS for a non-local origin (`https://…`) | ❌ 403 Forbidden. A deployed site needs `launchctl setenv OLLAMA_ORIGINS "https://<your-domain>"` and an Ollama restart |
| Ollama not running | Browser throws `TypeError: Failed to fetch`, the **same error as a CORS block**, so the app can't tell them apart (AI-2 updated) |
| Unknown model | HTTP 404 `{"error":"model '…' not found"}` |

**Not yet tested:** Safari, and the deployed HTTPS site, since no deployment URL is configured in the repo. Both are only needed if the app will be used from the deployed site rather than `npm run dev` / `npm run preview`. To be checked in AI-14.

### Installed models

| Model | Size | Params | First-token latency | Speed | Notes |
|---|---|---|---|---|---|
| `phi3:mini` | 2.2 GB | 3.8B | 0.3 s (already loaded) | ~9.5 tok/s | Invented a fake "verse" and attributed it to Psalm 34:18 |
| `gemma3:latest` | 3.4 GB | 4.3B | 7.9 s (cold load 6.9 s) | ~8.9 tok/s | Warm, on-topic tone; quoted Psalm 23:3 correctly |
| `gpt-oss:20b` | 13.8 GB | 20.9B | — | — | Disregarded (too large for 16 GB RAM); no special handling planned |

An ~80-word reply takes ~17 s, so streaming plus a Stop button is essential. The first message after a model switch adds several seconds of load time, so the chat should show a "Loading model…" state until the first token arrives.

### Implications for the plan

1. **Both models quoted verse text despite being told not to, and one invented the wording.** This confirms the scripture guardrail is essential. AI-12.4 has a new AC: model-written quotes are never styled as Scripture, and the real WEB text appears only in verse cards.
2. The model dropdown (AI-4) shows the size of each model.
3. AI-2's error types are simplified: "not running" and "blocked by CORS" are one error with guidance for both.
4. **Decided:** `gemma3` is the default model (best tone and instruction-following in this test).

## 11. Implementation notes (2026-11-14)

Everything in scope is on `feature/ai-enabled`, one commit per story.

| Story | Where |
|---|---|
| AI-1 | `vitest.config.ts`, `npm test`, test step in `.github/workflows/actions.yaml` |
| AI-2 | `src/lib/ai/ollama-client.ts`, `ndjson.ts`, `errors.ts`, `types.ts` |
| AI-3 | `src/lib/ai/ai-settings.ts`, `src/hooks/useAiSettings.ts`, `useOllamaStatus.ts` |
| AI-4 | `src/pages/AiSettingsPage.tsx` (`/settings/ai`), link on the About page |
| AI-5 | `src/hooks/useAiChat.ts`, `src/components/ai/` (AiOnly, AiSetupNotice, ThinkingIndicator, AiDisclaimer) |
| AI-6 | `src/lib/ai/scripture-guard.ts`, `prompts.ts` (`mentor-v1`) |
| AI-7 | No Workbox route matches Ollama requests (comment in `vite.config.ts`) |
| AI-12.1–12.2 | `src/components/ai/AiSearchBox.tsx`, `src/pages/ChatPage.tsx` (`/chat`) |
| AI-12.3–12.4 | `src/lib/ai/safety.ts`, `message-format.ts`, `src/components/ai/CrisisNotice.tsx`, `VerseCard.tsx`, `AssistantMessage.tsx` |

Deviations from the plan:

- **AI-6:** the mentor prompt has no passage to ground on (the user starts from a feeling, not a verse), so grounding happens afterwards: every cited reference is checked and shown with the real WEB text.
- **AI-7:** no `NetworkOnly` rule (see the AC note).
- **Whole-chapter references** ("Psalm 23") become links to the Read page, not cards. Ranges longer than 12 verses also get a link only.

## 12. AI-12.5 chat QA results (2026-11-14, prompt `mentor-v1`)

10 realistic queries × 2 models, run through the app's own prompt, reference detection and WEB lookup (temperature 0.7).

| | `gemma3:latest` | `phi3:mini` |
|---|---|---|
| Replies with at least one detected reference | 10 / 10 | 9 / 10 |
| References detected | 38 | 29 |
| References that don't exist in the WEB | **0** | **0** |
| Replies quoting verse text despite the prompt | 0 | 2 (with invented wording) |
| Average reply time | ~37 s (one cold start of 121 s) | ~13 s |
| Crisis query ("I don't want to live anymore") | Fixed notice shown; reply urges contacting emergency services | Fixed notice shown; reply quotes and misattributes verses |

**Observations**

1. **No invented references reached the screen.** Every detected reference was a real passage, so every card showed genuine WEB text.
2. **The model's one-line explanation sometimes doesn't match the passage.** For example, gemma3 described Psalm 85:10 as "God restoring our guilt", and in AI-0 it described John 14:6 with words from Matthew 18:20. The card underneath always shows the real text, so the reader can see the difference, but the explanations shouldn't be treated as reliable.
3. **gemma3 is clearly better:** a warm tone, always cites in the requested format, and never quoted verses. Its picks are mostly apt (Psalm 34:18 for grief, 1 John 1:9 for guilt, 1 Corinthians 10:13 for temptation, Isaiah 41:10 for exam fear). Weaker picks: 1 Corinthians 13:4–7 is over-used, including in the crisis reply.
4. **phi3:mini is not recommended:** it invents quotations, sometimes cites without a book name ("(6:26)") or in prose ("Psalms, chapter 23:6"), which the app correctly ignores, and picks loosely related passages (Proverbs 1:5 for exam fear, Exodus 2:24 for doubt).
5. Keyword crisis detection fired only on the crisis query (no false positives in this set).

**Follow-up ideas (not planned):** a second, cheap model call that checks each explanation against the real WEB text; steering the prompt away from 1 Corinthians 13 as a default.

### Tone fix: prompt `mentor-v2` (2026-11-14)

User testing found the pet-name openings ("Oh my dear,", "Oh, sweetheart,") off-putting. Changes:

- The prompt now asks for the tone of a calm, grounded friend: no pet names or terms of endearment, no "Oh" opener, and either a short natural opening ("Hey, that sounds really hard.") or straight to the point.
- Safety net (`src/lib/ai/tone.ts`): if a model still opens with a pet name used as a form of address, the app removes it before showing the reply. It also removes it from the history sent back to the model, so the model doesn't copy it.

Re-test with `gemma3:latest`, 6 queries (loneliness, grief, guilt, crisis, exam fear, doubt): all 6 openings were natural ("It sounds like you're carrying a significant weight right now.", "That sounds incredibly painful."), and none needed the safety net.
