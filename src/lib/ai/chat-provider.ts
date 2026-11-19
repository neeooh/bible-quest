import { getAiSettings, pickModel, saveAiSettings, type AiSettings } from './ai-settings';
import { hostedMentorReply } from './hosted-client';
import { chatStream, listModels } from './ollama-client';
import { AiError, type ChatMessage } from './types';

/**
 * The one interface the chat uses, whatever answers it. Add a provider by
 * implementing this and choosing it in {@link getChatProvider}.
 */
export interface ChatProvider {
  /** Yields the reply as it arrives (all at once for providers that don't stream). */
  reply(messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string, void>;
}

/** Uses the saved Ollama model, or picks one (gemma3 first) and saves it. */
async function resolveOllamaModel(baseUrl: string, saved: string, signal: AbortSignal): Promise<string> {
  if (saved) return saved;
  const model = pickModel(await listModels(baseUrl, signal), saved);
  if (!model) {
    throw new AiError('model_not_found', 'No models are installed in Ollama yet.');
  }
  saveAiSettings({ model });
  return model;
}

function ollamaProvider(settings: AiSettings): ChatProvider {
  return {
    async *reply(messages, signal) {
      const model = await resolveOllamaModel(settings.baseUrl, settings.model, signal);
      yield* chatStream(settings.baseUrl, messages, {
        model,
        signal,
        options: { temperature: settings.temperature },
      });
    },
  };
}

const hostedProvider: ChatProvider = {
  async *reply(messages, signal) {
    yield await hostedMentorReply(messages, signal);
  },
};

export function getChatProvider(settings: AiSettings = getAiSettings()): ChatProvider {
  return settings.provider === 'hosted' ? hostedProvider : ollamaProvider(settings);
}
