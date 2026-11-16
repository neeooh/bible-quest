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

/** Turns any error from the Ollama client into a friendly message. */
export function describeAiError(
  err: unknown,
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
): AiErrorDescription {
  const error: AiError = isAiError(err)
    ? err
    : new AiError('bad_response', err instanceof Error ? err.message : String(err));

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
