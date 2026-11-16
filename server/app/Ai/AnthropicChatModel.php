<?php

namespace App\Ai;

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\APITimeoutException;
use Anthropic\Core\Exceptions\InternalServerException;
use Anthropic\Core\Exceptions\OverloadedException;
use Anthropic\Core\Exceptions\RateLimitException;
use Anthropic\Core\Exceptions\ServiceUnavailableException;

final class AnthropicChatModel implements ChatModel
{
    public function __construct(
        private readonly Client $client,
        private readonly string $model,
        private readonly string $effort,
        private readonly int $maxTokens,
        private readonly float $timeoutSeconds,
    ) {}

    public function reply(string $system, array $messages): ChatReply
    {
        try {
            $message = $this->client->messages->create(
                model: $this->model,
                maxTokens: $this->maxTokens,
                system: $system,
                messages: $messages,
                outputConfig: ['effort' => $this->effort],
                requestOptions: ['timeout' => $this->timeoutSeconds, 'maxRetries' => 1],
            );
        } catch (RateLimitException|OverloadedException|ServiceUnavailableException|InternalServerException|APITimeoutException|APIConnectionException $e) {
            throw new ChatModelException('The AI provider is busy: '.class_basename($e), temporary: true, previous: $e);
        } catch (APIStatusException $e) {
            throw new ChatModelException('The AI provider rejected the request: '.class_basename($e), previous: $e);
        } catch (APIException $e) {
            throw new ChatModelException('The AI provider failed: '.class_basename($e), previous: $e);
        }

        $usage = $message->usage;
        $inputTokens = $usage->inputTokens
            + ($usage->cacheCreationInputTokens ?? 0)
            + ($usage->cacheReadInputTokens ?? 0);

        if ($message->stopReason === 'refusal') {
            return new ChatReply('', $inputTokens, $usage->outputTokens, refused: true);
        }

        $text = '';
        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text;
            }
        }

        return new ChatReply(trim($text), $inputTokens, $usage->outputTokens);
    }
}
