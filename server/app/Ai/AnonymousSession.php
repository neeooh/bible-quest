<?php

namespace App\Ai;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

/**
 * A signed, expiring token that ties requests to one device without an
 * account. Issued after the bot check, so a script has to pass Turnstile to
 * get each new device identity.
 *
 * Later, a signed-in user's token can carry a user id and plan instead; the
 * quota code keys usage on whatever subject the token names.
 */
final class AnonymousSession
{
    /** @return array{token: string, expiresAt: int} */
    public static function issue(string $deviceId): array
    {
        $expiresAt = now()->addMinutes((int) config('ai.session_ttl_minutes'))->getTimestamp();

        return [
            'token' => Crypt::encryptString(json_encode(['d' => $deviceId, 'exp' => $expiresAt])),
            'expiresAt' => $expiresAt,
        ];
    }

    /** The device id the token was issued to, or null if it is invalid or expired. */
    public static function deviceFrom(?string $token): ?string
    {
        if (! $token) {
            return null;
        }
        try {
            $payload = json_decode(Crypt::decryptString($token), true);
        } catch (DecryptException) {
            return null;
        }
        if (! is_array($payload) || ! is_string($payload['d'] ?? null) || ! is_int($payload['exp'] ?? null)) {
            return null;
        }

        return $payload['exp'] > now()->getTimestamp() ? $payload['d'] : null;
    }
}
