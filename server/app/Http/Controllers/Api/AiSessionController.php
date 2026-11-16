<?php

namespace App\Http\Controllers\Api;

use App\Ai\AnonymousSession;
use App\Ai\Turnstile;
use App\Ai\UsageLedger;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** POST /api/v1/ai/session — swaps a bot-check token for an anonymous session token. */
class AiSessionController extends Controller
{
    public function __invoke(Request $request, UsageLedger $ledger): JsonResponse
    {
        $data = $request->validate([
            // Random id the app generates once per device (UUID).
            'deviceId' => ['required', 'string', 'uuid'],
            'turnstileToken' => ['nullable', 'string', 'max:4096'],
        ]);

        if (! Turnstile::verify($data['turnstileToken'] ?? null, $request->ip())) {
            return ApiError::response('bot_check_failed', 'The security check failed. Please reload the page and try again.', 403);
        }

        $deviceId = strtolower($data['deviceId']);
        $limit = (int) config('ai.limits.device_daily_messages');

        return response()->json([
            ...AnonymousSession::issue($deviceId),
            'dailyLimit' => $limit,
            'remainingToday' => max(0, $limit - $ledger->requestsToday(UsageLedger::device($deviceId))),
        ]);
    }
}
