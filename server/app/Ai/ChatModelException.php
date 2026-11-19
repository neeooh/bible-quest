<?php

namespace App\Ai;

use RuntimeException;

/** The vendor could not produce a reply. Never carries the user's messages. */
class ChatModelException extends RuntimeException
{
    public function __construct(
        string $message,
        /** True for problems worth retrying later (overloaded, rate limited, timeout). */
        public readonly bool $temporary = false,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
