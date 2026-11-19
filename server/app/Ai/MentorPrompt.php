<?php

namespace App\Ai;

/**
 * The mentor's system prompt. The server always supplies it; clients only
 * send the conversation. The PWA imports the same file for local Ollama, so
 * there is one copy of the wording.
 */
final class MentorPrompt
{
    public static function text(): string
    {
        return trim((string) file_get_contents(resource_path('prompts/mentor.txt')));
    }
}
