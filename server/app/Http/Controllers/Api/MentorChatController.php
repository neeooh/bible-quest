<?php

namespace App\Http\Controllers\Api;

use App\Ai\AnonymousSession;
use App\Ai\ChatModel;
use App\Ai\ChatModelException;
use App\Ai\MentorPrompt;
use App\Ai\UsageLedger;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

/**
 * POST /api/v1/ai/mentor — one reply from the BibleQuest mentor.
 *
 * The client sends only the conversation; the system prompt, model and
 * limits are all decided here. Message content is never logged or stored.
 */
class MentorChatController extends Controller
{
    public function __invoke(Request $request, UsageLedger $ledger): JsonResponse
    {
        if (! config('ai.enabled') || ! app()->bound(ChatModel::class)) {
            return ApiError::response('unavailable', 'The AI mentor is not available right now.', 503);
        }

        $deviceId = AnonymousSession::deviceFrom($request->bearerToken());
        if (! $deviceId) {
            return ApiError::response('session_invalid', 'Your session has expired.', 401);
        }

        $maxChars = (int) config('ai.limits.max_message_chars');
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:200'],
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:'.$maxChars],
        ], [
            'messages.*.content.max' => "Messages can be at most {$maxChars} characters.",
        ]);

        $messages = $this->trimHistory($data['messages']);
        if ($messages === []) {
            return ApiError::response('invalid_request', 'The conversation must end with your message.', 422);
        }

        // Short bursts from one network.
        $ipSubject = UsageLedger::ip($request->ip());
        $burstKey = 'ai-burst:'.$ipSubject;
        if (RateLimiter::tooManyAttempts($burstKey, (int) config('ai.limits.ip_per_minute'))) {
            $wait = RateLimiter::availableIn($burstKey);

            return ApiError::response('rate_limited', 'You’re sending messages quickly. Please wait a moment.', 429, ['Retry-After' => $wait]);
        }
        RateLimiter::hit($burstKey, 60);

        // The whole service's daily budget.
        if ($ledger->costTodayUsd() >= (float) config('ai.limits.daily_budget_usd')) {
            return ApiError::response('resting', 'The AI mentor is resting for today. Please come back tomorrow.', 503);
        }

        $deviceSubject = UsageLedger::device($deviceId);
        $deviceLimit = (int) config('ai.limits.device_daily_messages');
        $deviceUsed = $ledger->requestsToday($deviceSubject);
        if ($deviceUsed >= $deviceLimit || $ledger->requestsToday($ipSubject) >= (int) config('ai.limits.ip_daily_messages')) {
            return ApiError::response('daily_limit', 'You’ve reached today’s free messages. They reset at midnight (UTC).', 429);
        }

        try {
            $reply = app(ChatModel::class)->reply(MentorPrompt::text(), $messages);
        } catch (ChatModelException $e) {
            Log::warning('Mentor reply failed', ['reason' => $e->getMessage()]);

            return $e->temporary
                ? ApiError::response('busy', 'The AI mentor is busy. Please try again in a moment.', 503, ['Retry-After' => 30])
                : ApiError::response('upstream_error', 'The AI mentor couldn’t answer just now.', 502);
        }

        $ledger->record([$deviceSubject, $ipSubject], $reply->inputTokens, $reply->outputTokens);
        $remaining = max(0, $deviceLimit - $deviceUsed - 1);

        if ($reply->refused || $reply->text === '') {
            return ApiError::response('refused', 'The mentor can’t help with that message. Try putting it another way.', 422);
        }

        return response()->json([
            'reply' => $reply->text,
            'remainingToday' => $remaining,
            'dailyLimit' => $deviceLimit,
        ]);
    }

    /**
     * Keeps the most recent turns within the history limits. The result starts
     * and ends with a user message; empty when the last message is not the user's.
     *
     * @param  list<array{role: string, content: string}>  $messages
     * @return list<array{role: 'user'|'assistant', content: string}>
     */
    private function trimHistory(array $messages): array
    {
        $messages = array_values(array_filter(
            array_map(fn ($m) => ['role' => $m['role'], 'content' => trim($m['content'])], $messages),
            fn ($m) => $m['content'] !== '',
        ));
        if ($messages === [] || end($messages)['role'] !== 'user') {
            return [];
        }

        $maxMessages = (int) config('ai.limits.max_history_messages');
        $maxChars = (int) config('ai.limits.max_history_chars');
        $kept = [];
        $chars = 0;
        foreach (array_reverse($messages) as $message) {
            $chars += mb_strlen($message['content']);
            if ($kept !== [] && (count($kept) >= $maxMessages || $chars > $maxChars)) {
                break;
            }
            array_unshift($kept, $message);
        }
        while ($kept !== [] && $kept[0]['role'] !== 'user') {
            array_shift($kept);
        }

        return $kept;
    }
}
