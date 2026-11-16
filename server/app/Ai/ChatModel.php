<?php

namespace App\Ai;

/**
 * One LLM vendor. The rest of the app only talks to this interface, so the
 * vendor can be swapped in config without touching controllers or the PWA.
 */
interface ChatModel
{
    /**
     * @param  list<array{role: 'user'|'assistant', content: string}>  $messages  Oldest first; starts and ends with a user message.
     *
     * @throws ChatModelException
     */
    public function reply(string $system, array $messages): ChatReply;
}
