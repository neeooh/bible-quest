<?php

namespace App\Ai;

use Illuminate\Support\Facades\DB;

/**
 * Daily counters in the ai_usage table: one row per (day, subject). Subjects
 * are "device:<id>", "ip:<hash>" and "global". Only counts and token totals
 * are stored, never message content.
 */
final class UsageLedger
{
    public const GLOBAL = 'global';

    public static function device(string $deviceId): string
    {
        return 'device:'.$deviceId;
    }

    /** IP addresses are stored as a keyed hash, not in the clear. */
    public static function ip(?string $ip): string
    {
        return 'ip:'.substr(hash_hmac('sha256', (string) $ip, (string) config('app.key')), 0, 32);
    }

    public function requestsToday(string $subject): int
    {
        return (int) $this->row($subject)?->requests;
    }

    public function costTodayUsd(): float
    {
        return ((int) $this->row(self::GLOBAL)?->cost_micro_usd) / 1_000_000;
    }

    public static function costMicroUsd(int $inputTokens, int $outputTokens): int
    {
        $usd = $inputTokens * (float) config('ai.pricing.input_per_mtok') / 1_000_000
            + $outputTokens * (float) config('ai.pricing.output_per_mtok') / 1_000_000;

        return (int) ceil($usd * 1_000_000);
    }

    /** @param  list<string>  $subjects */
    public function record(array $subjects, int $inputTokens, int $outputTokens): void
    {
        $cost = self::costMicroUsd($inputTokens, $outputTokens);
        $day = $this->today();
        $now = now();

        DB::transaction(function () use ($subjects, $day, $now, $inputTokens, $outputTokens, $cost) {
            foreach (array_unique([...$subjects, self::GLOBAL]) as $subject) {
                DB::table('ai_usage')->insertOrIgnore([
                    'day' => $day, 'subject' => $subject,
                    'requests' => 0, 'input_tokens' => 0, 'output_tokens' => 0, 'cost_micro_usd' => 0,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
                DB::table('ai_usage')->where(['day' => $day, 'subject' => $subject])->update([
                    'requests' => DB::raw('requests + 1'),
                    'input_tokens' => DB::raw('input_tokens + '.$inputTokens),
                    'output_tokens' => DB::raw('output_tokens + '.$outputTokens),
                    'cost_micro_usd' => DB::raw('cost_micro_usd + '.$cost),
                    'updated_at' => $now,
                ]);
            }
        });
    }

    /** Days run in UTC, so limits reset at midnight UTC. */
    private function today(): string
    {
        return now('UTC')->toDateString();
    }

    private function row(string $subject): ?object
    {
        return DB::table('ai_usage')->where(['day' => $this->today(), 'subject' => $subject])->first();
    }
}
