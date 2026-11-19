<?php

namespace App\Providers;

use Anthropic\Client;
use App\Ai\AnthropicChatModel;
use App\Ai\ChatModel;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // The LLM vendor behind the mentor. Not bound when no key is set, so
        // the API answers "unavailable" instead of failing.
        if (config('ai.vendor') === 'anthropic' && config('ai.anthropic.api_key')) {
            $this->app->singleton(ChatModel::class, fn () => new AnthropicChatModel(
                new Client(apiKey: (string) config('ai.anthropic.api_key')),
                model: (string) config('ai.anthropic.model'),
                effort: (string) config('ai.anthropic.effort'),
                maxTokens: (int) config('ai.anthropic.max_tokens'),
                timeoutSeconds: (float) config('ai.anthropic.timeout_seconds'),
            ));
        }
    }

    public function boot(): void
    {
        //
    }
}
