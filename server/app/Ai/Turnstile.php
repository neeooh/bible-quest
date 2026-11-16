<?php

namespace App\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/** Cloudflare Turnstile: an invisible check that the caller is a real browser. */
final class Turnstile
{
    public static function enabled(): bool
    {
        return (string) config('ai.turnstile.secret_key') !== '';
    }

    public static function verify(?string $token, ?string $ip): bool
    {
        if (! self::enabled()) {
            return true;
        }
        if (! $token) {
            return false;
        }
        try {
            $response = Http::asForm()->timeout(10)->post(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                array_filter([
                    'secret' => config('ai.turnstile.secret_key'),
                    'response' => $token,
                    'remoteip' => $ip,
                ]),
            );

            return $response->ok() && $response->json('success') === true;
        } catch (Throwable $e) {
            Log::warning('Turnstile verification failed', ['error' => class_basename($e)]);

            return false;
        }
    }
}
