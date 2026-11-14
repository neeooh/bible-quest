export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface OllamaModel {
  /** Full model name including tag, e.g. "gemma3:latest". */
  name: string;
  /** Size on disk in bytes. */
  size: number;
  /** e.g. "4.3B" */
  parameterSize?: string;
  family?: string;
}

/** Timing stats Ollama reports at the end of a chat stream. */
export interface ChatStats {
  evalCount?: number;
  /** Nanoseconds. */
  evalDuration?: number;
  /** Nanoseconds. */
  loadDuration?: number;
}

export type AiErrorCode =
  /** Ollama not running, wrong URL, or blocked by CORS (the browser can't tell these apart). */
  | 'unreachable'
  | 'model_not_found'
  | 'timeout'
  | 'bad_response'
  | 'aborted';

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status?: number;

  constructor(code: AiErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
  }
}

export function isAiError(err: unknown): err is AiError {
  return err instanceof AiError;
}
