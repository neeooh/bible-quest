import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AI_SETTINGS_EVENT,
  formatModelSize,
  getAiSettings,
  getDefaultAiSettings,
  pickModel,
  saveAiSettings,
} from './ai-settings';

const KEY = 'biblequest-ai-settings-v1';
const model = (name: string) => ({ name, size: 1 });

beforeEach(() => {
  localStorage.clear();
});

describe('getAiSettings', () => {
  it('returns defaults when nothing is stored (AI off by default)', () => {
    expect(getAiSettings()).toEqual(getDefaultAiSettings());
    expect(getAiSettings().enabled).toBe(false);
    expect(getAiSettings().baseUrl).toBe('http://localhost:11434');
  });

  it('falls back to defaults on corrupt storage', () => {
    localStorage.setItem(KEY, '{not json');
    expect(getAiSettings()).toEqual(getDefaultAiSettings());
  });

  it('merges stored values with defaults and drops invalid fields', () => {
    localStorage.setItem(KEY, JSON.stringify({ enabled: true, temperature: 'hot', model: 'phi3:mini' }));
    expect(getAiSettings()).toEqual({
      ...getDefaultAiSettings(),
      enabled: true,
      model: 'phi3:mini',
    });
  });
});

describe('saveAiSettings', () => {
  it('persists partial updates and notifies listeners', () => {
    const listener = vi.fn();
    window.addEventListener(AI_SETTINGS_EVENT, listener);
    saveAiSettings({ enabled: true });
    saveAiSettings({ model: 'gemma3:latest' });
    window.removeEventListener(AI_SETTINGS_EVENT, listener);

    expect(getAiSettings()).toMatchObject({ enabled: true, model: 'gemma3:latest' });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('pickModel', () => {
  const installed = [model('gpt-oss:20b'), model('gemma3:latest'), model('phi3:mini')];

  it('keeps the saved model when it is still installed', () => {
    expect(pickModel(installed, 'phi3:mini')).toBe('phi3:mini');
  });

  it('prefers gemma3 when nothing is saved', () => {
    expect(pickModel(installed, '')).toBe('gemma3:latest');
  });

  it('prefers gemma3 when the saved model was removed', () => {
    expect(pickModel(installed, 'llama3:8b')).toBe('gemma3:latest');
  });

  it('does not match other families that start with the same letters', () => {
    expect(pickModel([model('gemma3n:e4b'), model('phi3:mini')], '')).toBe('gemma3n:e4b');
  });

  it('falls back to the first installed model, or empty when none', () => {
    expect(pickModel([model('phi3:mini')], '')).toBe('phi3:mini');
    expect(pickModel([], '')).toBe('');
  });
});

describe('formatModelSize', () => {
  it('formats bytes as GB or MB', () => {
    expect(formatModelSize(3_350_000_000)).toBe('3.4 GB');
    expect(formatModelSize(500_000_000)).toBe('500 MB');
  });
});
