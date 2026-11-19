<?php

namespace App\Ai;

final readonly class ChatReply
{
    public function __construct(
        public string $text,
        public int $inputTokens,
        public int $outputTokens,
        /** The model declined to answer (safety). $text is empty. */
        public bool $refused = false,
    ) {}
}
