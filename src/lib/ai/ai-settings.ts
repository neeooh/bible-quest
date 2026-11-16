import { isHostedAiConfigured } from './hosted-client';
import { DEFAULT_OLLAMA_URL } from './ollama-client';
import type { OllamaModel } from './types';

const STORAGE_KEY = 'biblequest-ai-settings-v1';
/** Fired on window when settings change in this tab. */
export const AI_SETTINGS_EVENT = 'biblequest-ai-settings-change';

/** Preferred model family; preselected when installed. */
export const PREFERRED_MODEL_PREFIX = 'gemma3';

/**
 * hosted – BibleQuest's own AI service (free, with daily limits)
 * ollama  – a model on the user's own computer (advanced)
 */
export type AiProviderKind = 'hosted' | 'ollama';

export interface AiSettings {
  enabled: boolean;
  provider: AiProviderKind;
  /** Ollama address. */
  baseUrl: string;
  /** Selected Ollama model, e.g. "gemma3:latest". Empty until the user (or auto-pick) chooses one. */
  model: string;
  /** Ollama only; the hosted service sets its own. */
  temperature: number;
  /** Keep past AI Chat conversations on this device. */
  saveHistory: boolean;
}

export function getDefaultAiSettings(): AiSettings {
  const hosted = isHostedAiConfigured();
  return {
    // With the hosted service, AI works out of the box for everyone.
    enabled: hosted,
    provider: hosted ? 'hosted' : 'ollama',
    baseUrl: DEFAULT_OLLAMA_URL,
    model: '',
    temperature: 0.7,
    saveHistory: true,
  };
}

function sanitize(raw: unknown): AiSettings {
  const defaults = getDefaultAiSettings();
  if (!raw || typeof raw !== 'object') return defaults;
  const r = raw as Partial<Record<keyof AiSettings, unknown>>;
  // Settings saved before the hosted service existed have no provider: keep
  // anyone who had Ollama switched on with Ollama, and move everyone else to
  // the hosted service with AI on.
  const legacy = r.provider === undefined;
  let provider: AiProviderKind =
    r.provider === 'hosted' || r.provider === 'ollama'
      ? r.provider
      : legacy && r.enabled === true
        ? 'ollama'
        : defaults.provider;
  if (provider === 'hosted' && !isHostedAiConfigured()) provider = 'ollama';
  return {
    enabled:
      legacy && provider === 'hosted'
        ? defaults.enabled
        : typeof r.enabled === 'boolean'
          ? r.enabled
          : defaults.enabled,
    provider,
    baseUrl: typeof r.baseUrl === 'string' && r.baseUrl.trim() ? r.baseUrl : defaults.baseUrl,
    model: typeof r.model === 'string' ? r.model : defaults.model,
    temperature:
      typeof r.temperature === 'number' && r.temperature >= 0 && r.temperature <= 2
        ? r.temperature
        : defaults.temperature,
    saveHistory: typeof r.saveHistory === 'boolean' ? r.saveHistory : defaults.saveHistory,
  };
}

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAiSettings();
    // Merge with defaults so newly added fields are always present.
    return sanitize(JSON.parse(raw));
  } catch {
    return getDefaultAiSettings();
  }
}

export function saveAiSettings(updates: Partial<AiSettings>): AiSettings {
  const next = sanitize({ ...getAiSettings(), ...updates });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked; keep working with in-memory settings.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_SETTINGS_EVENT));
  }
  return next;
}

export function isModelInstalled(models: OllamaModel[], name: string): boolean {
  return !!name && models.some((m) => m.name === name);
}

/**
 * Chooses the model to use: the saved one if still installed, otherwise
 * gemma3 (any tag) if installed, otherwise the first installed model.
 */
export function pickModel(models: OllamaModel[], saved: string): string {
  if (isModelInstalled(models, saved)) return saved;
  const preferred = models.find(
    (m) => m.name === PREFERRED_MODEL_PREFIX || m.name.startsWith(`${PREFERRED_MODEL_PREFIX}:`),
  );
  return preferred?.name ?? models[0]?.name ?? '';
}

export function formatModelSize(bytes: number): string {
  if (!bytes) return '';
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}

/** "gemma3:latest" → "gemma3"; other tags are kept ("phi3:mini"). */
export function shortModelName(name: string): string {
  return name.replace(/:latest$/, '');
}
