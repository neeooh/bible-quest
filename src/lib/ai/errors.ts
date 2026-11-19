import type { AiProviderKind } from './ai-settings';
import { AiError, isAiError } from './types';

export interface AiErrorDescription {
  title: string;
  /** One or more short suggestions, shown as a list. */
  hints: string[];
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

/** Turns an error from the hosted AI service into a friendly message. */
function describeHostedError(error: AiError): AiErrorDescription {
  switch (error.code) {
    case 'unreachable':
      return {
        title: 'Can’t reach the AI mentor',
        hints: ['Check your internet connection and try again.'],
      };
    case 'timeout':
      return { title: 'The AI mentor took too long', hints: ['Please try again in a moment.'] };
    case 'rate_limited':
      return { title: 'One moment', hints: [error.message || 'You’re sending messages quickly. Please wait a moment.'] };
    case 'daily_limit':
      return {
        title: 'That’s all for today',
        hints: [
          error.message || 'You’ve used today’s free messages.',
          'Your saved verses and chats are still here. You can also use your own Ollama in AI settings.',
        ],
      };
    case 'unavailable':
      return {
        title: 'The AI mentor is resting',
        hints: [error.message || 'The AI mentor is not available right now. Please try again later.'],
      };
    case 'bot_check':
      return {
        title: 'Security check failed',
        hints: ['Please reload the page and try again.'],
      };
    case 'refused':
      return {
        title: 'The mentor can’t answer that',
        hints: [error.message || 'Try putting it another way.'],
      };
    case 'aborted':
      return { title: 'Stopped', hints: [] };
    default:
      return { title: 'Something went wrong', hints: [error.message] };
  }
}

/** Turns any error from the chat (hosted service or Ollama) into a friendly message. */
export function describeAiError(
  err: unknown,
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
  provider: AiProviderKind = 'ollama',
): AiErrorDescription {
  const error: AiError = isAiError(err)
    ? err
    : new AiError('bad_response', err instanceof Error ? err.message : String(err));

  if (provider === 'hosted') return describeHostedError(error);

  switch (error.code) {
    case 'unreachable': {
      const hints = ['Make sure the Ollama app is running on this Mac.'];
      if (origin && !isLocalOrigin(origin)) {
        hints.push(
          `Allow this site in Ollama: run  launchctl setenv OLLAMA_ORIGINS "${origin}"  in Terminal, then restart Ollama. See the About page for details.`,
        );
      }
      hints.push('Check the Ollama address in AI settings.');
      return { title: 'Can’t reach Ollama', hints };
    }
    case 'model_not_found':
      return {
        title: 'Model not installed',
        hints: [error.message, 'Choose another model in AI settings, or install it with  ollama pull <model>.'],
      };
    case 'timeout':
      return {
        title: 'Ollama took too long',
        hints: ['The model may still be loading. Try again in a moment, or choose a smaller model.'],
      };
    case 'aborted':
      return { title: 'Stopped', hints: [] };
    case 'bad_response':
    default:
      return { title: 'Something went wrong', hints: [error.message] };
  }
}
