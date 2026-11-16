<?php

namespace Tests\Feature\Ai;

use App\Ai\ChatModel;
use App\Ai\ChatModelException;
use App\Ai\ChatReply;

final class FakeChatModel implements ChatModel
{
    /** @var list<array{system: string, messages: array}> */
    public array $calls = [];

    public function __construct(
        private ChatReply|ChatModelException $result = new ChatReply('Psalm 34:18 is for you.', 1000, 200),
    ) {}

    public function reply(string $system, array $messages): ChatReply
    {
        $this->calls[] = ['system' => $system, 'messages' => $messages];
        if ($this->result instanceof ChatModelException) {
            throw $this->result;
        }

        return $this->result;
    }
}
