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
  /** Server not reachable: Ollama not running, wrong URL, offline, or blocked by CORS (the browser can't tell these apart). */
  | 'unreachable'
  | 'model_not_found'
  | 'timeout'
  | 'bad_response'
  | 'aborted'
  /** Hosted AI: sending too quickly; try again in a moment. */
  | 'rate_limited'
  /** Hosted AI: this device or network has used today's free messages. */
  | 'daily_limit'
  /** Hosted AI: the service's daily budget is spent, it is switched off, or the provider is busy. */
  | 'unavailable'
  /** Hosted AI: the bot check failed. */
  | 'bot_check'
  /** The model declined to answer this message. */
  | 'refused';

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
