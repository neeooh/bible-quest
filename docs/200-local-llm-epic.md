# Epic: Local LLM Assistant (Ollama)

| | |
|---|---|
| **Status** | Draft — awaiting decisions in §9 |
| **Epic key** | `AI` (stories `AI-0` … `AI-14`) |
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
3. **Design unchanged.** New UI is additive only and uses the existing tokens (`navy-*`, `gold-*`, `cream`), fonts, card styles, dialog and toast patterns. Nothing existing is restyled or moved.
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

#### AI-0 · Spike: Mac connectivity check (S, ~2 hours)
Confirm the browser can call Ollama in the two Mac scenarios in §3, and record the setup steps.
- **AC:** A short findings note (append to this doc) covering Chrome and Safari on the Mac against the local dev server and against the deployed site. It includes the exact `OLLAMA_ORIGINS` setup that worked, and the error each browser shows when the call is blocked (these feed the error messages in AI-2 and AI-4).
- **AC:** Confirms `/api/tags` returns both installed models with names and sizes.
- Model benchmarking is not needed: the user picks the model (see AI-4).
- No production code merged.

### Milestone 1 — Platform foundation

#### AI-1 · Test infrastructure (S)
Add Vitest (dev-only) and an `npm test` script. The repo has no tests today, and the AI layer needs them.
- **AC:** `npm test` runs in CI-like conditions with no network. One example test passes. `npm run build` is unaffected.

#### AI-2 · Ollama client (M)
`src/lib/ai/ollama-client.ts` with `getVersion`, `listModels`, `chatStream(messages, { model, signal, options })`.
- **AC:** Parses NDJSON chunks across arbitrary byte boundaries. Yields text deltas, and ends on `done: true`.
- **AC:** `AbortSignal` cancels mid-stream without an unhandled rejection.
- **AC:** Typed errors: `unreachable`, `cors_or_blocked`, `model_not_found`, `timeout`, `bad_response`, `aborted`.
- **AC:** Unit tests cover chunk splitting, errors and abort with a mocked `fetch`.

#### AI-3 · AI settings store and hook (S)
`ai-settings.ts` + `useAiSettings`: `enabled` (default `false`), `baseUrl` (default `http://localhost:11434`), `model`, `temperature`.
- **AC:** Follows the merge-with-defaults loading pattern from `progress.ts` (see commit `c5877c7`).
- **AC:** Corrupt or missing storage falls back to defaults. Unit tested.

#### AI-4 · AI settings page (M)
New route `/settings/ai` (entry point: see §9 Q2). Toggle, base URL field, **Test connection** button, model dropdown filled from `/api/tags`, short setup help (from AI-0 findings).
- **AC:** Test connection shows the Ollama version or a specific, human-readable error from AI-2.
- **AC:** A **model dropdown** lists every model installed in Ollama (live from `/api/tags`, with name and size). The user's choice is saved and used by every AI feature. There is no hardcoded model list: models added later with `ollama pull` appear after a refresh.
- **AC:** First run with no saved choice → the first installed model is preselected.
- **AC:** If the saved model is no longer installed, the settings page shows it as missing and asks the user to pick another. AI features show `AiSetupNotice` instead of failing.
- **AC:** Empty list → "Run `ollama pull <model>`" hint.
- **AC:** Matches existing page styling in dark and light themes and at 375px width. No changes to existing pages besides the agreed entry link.

#### AI-5 · Streaming chat hook and UI primitives (M)
`useAiChat`, `AiResponsePanel`, `AiActionButton`, `AiSetupNotice`.
- **AC:** Text streams in progressively. A Stop button cancels. Retry re-runs the same prompt.
- **AC:** With AI disabled, `AiActionButton` renders nothing (verified: no DOM output).
- **AC:** Accessible: `aria-live="polite"` on the response region, and keyboard-operable controls.
- **AC:** Panel unmount aborts the request.

#### AI-6 · Prompt library and scripture guard (M)
`prompts.ts` (one builder per feature, versioned) and `scripture-guard.ts`.
- **AC:** Every builder injects the WEB passage text and reference. Snapshot tests per builder.
- **AC:** The guard handles common forms ("John 3:16", "1 Cor 13:4-7", "Ps. 23", en-dashes, book abbreviations). It rejects out-of-range chapters and verses. Unit tested against `book-metadata`.

#### AI-7 · PWA and service-worker rules (S)
- **AC:** Workbox `NetworkOnly` for AI requests. Verified that the installed PWA's offline mode still works and AI shows `AiSetupNotice` when offline.
- **AC:** No change to the manifest, icons or precache contents.

### Milestone 2 — First feature, end-to-end (vertical slice)

#### AI-8 · Read page: "Ask about this passage" (M)
Add an AI action to the existing verse-selection action bar (next to Copy / Listen / Share), or inside its "More actions" menu (see §9 Q3). It opens a sheet with quick prompts — *Explain this*, *Historical context*, *How does this apply today?* — plus a free-text follow-up box.
- **AC:** Uses the selected verses' WEB text as grounding. Follow-up questions keep the conversation in memory for that sheet only.
- **AC:** References in answers are validated and linked by AI-6.
- **AC:** Fullscreen reading mode is unaffected.

**Release checkpoint:** after AI-8, ship it behind the settings toggle and gather feedback before Milestone 3.

### Milestone 3 — More features

#### AI-9 · Memorise: memory aid (M)
On `MemorizePage`, an "AI memory tip" action. It suggests chunking, a mnemonic or imagery for the current passage.
- **AC:** Never reveals the passage in a way that defeats the active exercise (the prompt forbids restating the full text, and the tip is shown before or after the exercise, not during scoring).
- **AC:** No effect on XP or stage.

#### AI-10 · Recitation: explain my mistakes (M)
After Full Recitation / Voice Recitation, an optional "Explain my mistakes" button. It sends the deterministic diff from `word-compare` (not raw free text) and returns friendly guidance, e.g. "you swapped 'faith' and 'hope'; the order follows…".
- **AC:** The accuracy score shown is still the deterministic one. AI output is advisory only.

#### AI-11 · Missing Words: meaning-based hint (S)
An optional second hint level that gives a clue to the word's meaning without the word itself (the existing letter hint stays unchanged).
- **AC:** If the model's hint contains the target word, it is rejected and the existing hint is used instead.
- **AC:** Using an AI hint counts as a hint in scoring, exactly like today's hint.

#### AI-12 · Topics / My Verses: "Find passages about…" (L)
Free-text query ("verses about patience in suffering") → model suggests references → only validated references are shown. Each card is built from bundled WEB text, with the existing Add-to-list / Add-to-collection actions.
- **AC:** Zero model-generated scripture text appears on cards.
- **AC:** Duplicates of already-saved passages are marked, not re-added.

#### AI-13 · Home: daily verse reflection (S)
Optional "Reflect" action on the Daily Verse card: a short reflection and one question to think about.
- **AC:** Cached per day in memory, so re-renders don't re-prompt. The card layout is unchanged when AI is disabled.

### Milestone 4 — Hardening and release

#### AI-14 · Docs, QA and release (S)
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
                  AI-8  ── release checkpoint ──►  AI-9 · AI-10 · AI-11 · AI-12 · AI-13 (any order)  ─►  AI-14
```

Rough total: about 14–19 working days for one developer. Milestones 0–2 (to the first usable feature) take about 6–8 days.

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
2. **Settings entry point:** there is no settings screen today. Options: (a) a link in the About page, (b) a small icon in the navbar next to the theme toggle, (c) a link inside each `AiSetupNotice`. *Recommendation: (a) + (c), which leaves the navbar untouched.*
3. **Read page placement:** a visible button in the selection action bar, or inside "More actions"? *Recommendation: "More actions" first, the least visual change.*
4. ~~**Default model.**~~ **Decided:** no fixed default. The user picks from a dropdown of installed models; the first one is preselected (AI-4).
5. **Priority order for Milestone 3** features.
