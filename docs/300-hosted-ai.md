# Hosted AI for everyone

| | |
|---|---|
| **Status** | Implemented on `feature/hosted-ai` (2026-11-16) |
| **Follows** | [200-local-llm-epic.md](200-local-llm-epic.md) |

## Goal

Anyone can use the AI mentor straight away: no account, no card, no API key, no Ollama. BibleQuest pays for it (budget: about £30/month), with limits and guard rails against abuse. The architecture leaves room for accounts and paid tiers later, but they are not built.

Bring-your-own-key was considered and parked: it only helps power users, and the app has no users yet.

## Decisions

- **Backend:** Laravel 13 in `server/` in this repo, deployed to the existing shared LAMP hosting (PHP 8.5; the locked packages need 8.4 or newer). The PWA stays a static site on FTP.
- **No streaming for now:** the API returns the whole reply in one response. It works on any shared host; the chat already shows a "thinking" state while waiting. Streaming can be added later if the host allows it.
- **Vendor:** Anthropic, `claude-haiku-5-5`, effort `low`. Swappable on the server (`App\Ai\ChatModel`) without an app release.
- **Ollama stays** as an advanced option in AI settings.
- **One prompt file:** `server/resources/prompts/mentor.txt`. The server always uses its own copy; the PWA imports the same file for Ollama.

## Guard rails

1. Daily spending cap for the whole service (server-side), on top of the monthly spend limit in the Anthropic Console.
2. The server owns the system prompt, model and reply length; clients can't send `system` messages, so the endpoint is useless as a general chatbot.
3. Per-device and per-IP daily limits, plus a per-IP per-minute limit.
4. Optional Cloudflare Turnstile check before an anonymous session token is issued.
5. No message content is stored or logged; only daily counts and token totals.

## App changes

- `src/lib/ai/chat-provider.ts`: the chat talks to a `ChatProvider` (hosted or Ollama) instead of the Ollama client.
- `src/lib/ai/hosted-client.ts`: anonymous session, device id, reply, error mapping, remaining-messages count.
- AI settings: "Who answers" (BibleQuest AI / My own Ollama). With a hosted API configured, AI is on by default; people who had Ollama switched on keep it.
- Copy about privacy now depends on the provider (settings, disclaimer, About page).

## Later

- Accounts and paid tiers: usage is already keyed on a subject; a signed-in token would name `user:<id>` and a plan.
- Streaming replies, if the host's PHP setup passes output through without buffering.
- Bring-your-own-key as another `ChatProvider`.
