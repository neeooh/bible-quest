<?php

/*
| Hosted AI for BibleQuest. Everyone can use it without an account; these
| limits keep the monthly bill predictable and stop the endpoint being used
| as a free general-purpose chatbot.
*/

return [

    // Master switch. When false the API answers "unavailable" and the app
    // shows a friendly notice.
    'enabled' => (bool) env('AI_ENABLED', true),

    // Which LLM vendor answers. Only "anthropic" exists today; add another
    // App\Ai\ChatModel implementation and bind it in AppServiceProvider.
    'vendor' => env('AI_VENDOR', 'anthropic'),

    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model' => env('AI_MODEL', 'claude-haiku-5-5'),
        // Thinking depth. "low" suits short, warm chat replies and keeps cost down.
        'effort' => env('AI_EFFORT', 'low'),
        // Hard ceiling per reply (thinking + text). The prompt asks for < 180 words.
        'max_tokens' => (int) env('AI_MAX_OUTPUT_TOKENS', 2048),
        'timeout_seconds' => (float) env('AI_TIMEOUT_SECONDS', 60),
    ],

    // USD per million tokens, used to estimate spend for the daily budget.
    // Keep in line with the vendor's price list for AI_MODEL.
    'pricing' => [
        'input_per_mtok' => (float) env('AI_PRICE_INPUT_PER_MTOK', 0.10),
        'output_per_mtok' => (float) env('AI_PRICE_OUTPUT_PER_MTOK', 0.50),
    ],

    'limits' => [
        // Once today's estimated spend reaches this, the mentor rests until
        // midnight UTC. ~£30/month ≈ $1.25/day. The vendor's own monthly
        // spend limit stays the hard backstop.
        'daily_budget_usd' => (float) env('AI_DAILY_BUDGET_USD', 1.25),
        'device_daily_messages' => (int) env('AI_DEVICE_DAILY_MESSAGES', 25),
        'ip_daily_messages' => (int) env('AI_IP_DAILY_MESSAGES', 75),
        'ip_per_minute' => (int) env('AI_IP_PER_MINUTE', 8),
        'max_message_chars' => (int) env('AI_MAX_MESSAGE_CHARS', 2000),
        // Older turns beyond these are dropped before calling the model.
        'max_history_messages' => (int) env('AI_MAX_HISTORY_MESSAGES', 20),
        'max_history_chars' => (int) env('AI_MAX_HISTORY_CHARS', 24000),
    ],

    // How long an anonymous session token lasts before the app gets a new one.
    'session_ttl_minutes' => (int) env('AI_SESSION_TTL_MINUTES', 1440),

    // Cloudflare Turnstile bot check. Leave empty to skip it (local development).
    'turnstile' => [
        'secret_key' => env('TURNSTILE_SECRET_KEY'),
    ],

];
