<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;

/**
 * Error body shared by every AI endpoint: {"error": {"code", "message"}}.
 * The PWA maps the code to a friendly message; keep codes stable.
 */
final class ApiError
{
    public static function response(string $code, string $message, int $status, array $headers = []): JsonResponse
    {
        return response()->json(['error' => ['code' => $code, 'message' => $message]], $status, $headers);
    }
}
