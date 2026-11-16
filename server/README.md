# BibleQuest AI API

A small Laravel app that lets everyone use the BibleQuest AI mentor with no account and no API key. The PWA calls it; it calls the LLM vendor with your API key and keeps the bill predictable.

```
PWA ──► POST /api/v1/ai/session  (bot check → anonymous session token)
    ──► POST /api/v1/ai/mentor   (conversation → one reply)
                 │ daily limits · budget cap · server-owned prompt
                 ▼
            Anthropic (claude-haiku-5-5)
```

## What it protects against

| Guard | Default | Setting |
|---|---|---|
| Daily spending cap for the whole service; the mentor "rests" until midnight UTC when reached | $1.25/day (≈ £30/month) | `AI_DAILY_BUDGET_USD` |
| Messages per device per day | 25 | `AI_DEVICE_DAILY_MESSAGES` |
| Messages per network (IP) per day | 75 | `AI_IP_DAILY_MESSAGES` |
| Messages per network per minute | 8 | `AI_IP_PER_MINUTE` |
| Message length / history sent to the model | 2,000 chars / last 20 messages, 24,000 chars | `AI_MAX_*` |
| Bot check (Cloudflare Turnstile) before a session is issued | off until a key is set | `TURNSTILE_SECRET_KEY` |
| System prompt, model and reply length chosen by the server only | — | `resources/prompts/mentor.txt`, `AI_MODEL` |

Keep the monthly spend limit on the Anthropic Console as well: it's the hard backstop, and the daily cap here stops one bad night from using the whole month.

**Privacy:** message content is never stored or logged. The `ai_usage` table only keeps daily counts and token totals per device id, per hashed IP and overall.

**Later (accounts, paid tiers):** usage is keyed on a *subject* (`device:…`, `ip:…`). A signed-in user would get a token naming `user:…` and a plan, and the limits would come from the plan. Nothing else needs to change.

## Local development

```bash
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve          # http://localhost:8000
```

Put your key in `server/.env` as `ANTHROPIC_API_KEY=…`. Without a key the API answers `unavailable` and the app says the mentor isn't available.

In the repository root, create `.env.local` with `VITE_AI_API_URL=http://localhost:8000`, then `npm run dev`.

Tests: `php artisan test` (they use a fake model, so they never call Anthropic or need a key).

## Deploying to shared hosting (LAMP, PHP 8.3+)

1. **Make a subdomain**, for example `api.your-domain`, and point its document root at `server/public` (not at `server`).
2. **Upload the code.** Either `git clone` on the host, or build locally with `composer install --no-dev --optimize-autoloader` and upload the `server` folder including `vendor/`.
3. **Create a MySQL database** in the hosting panel.
4. **Create `server/.env`** from `.env.example` and set at least:
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.your-domain
   DB_CONNECTION=mysql
   DB_HOST=… DB_DATABASE=… DB_USERNAME=… DB_PASSWORD=…
   CACHE_STORE=database
   ANTHROPIC_API_KEY=…
   AI_ALLOWED_ORIGINS=https://biblequest.causewaysoft.com
   ```
5. **Run once over SSH** (or the host's terminal): `php artisan key:generate`, `php artisan migrate --force`, `php artisan config:cache`.
6. **Point the app at it:** in GitHub → Settings → Secrets and variables → Actions → *Variables*, set `VITE_AI_API_URL=https://api.your-domain`. The next deploy from `main` uses it.
7. **Optional bot check:** create a Turnstile widget at Cloudflare (mode *Invisible* or *Managed*, hostname = the app's domain). Put the secret key in `TURNSTILE_SECRET_KEY` here and the site key in the `VITE_TURNSTILE_SITE_KEY` repository variable.

Check it works: `https://api.your-domain/up` returns 200.

## Switching vendor or model

`AI_MODEL` changes the Claude model (update `AI_PRICE_*` to match its price). Another vendor means one class implementing `App\Ai\ChatModel`, bound in `AppServiceProvider` when `AI_VENDOR` names it.
