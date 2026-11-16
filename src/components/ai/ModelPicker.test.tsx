import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModelPicker from './ModelPicker';
import { shortModelName } from '../../lib/ai/ai-settings';
import type { OllamaStatus } from '../../hooks/useOllamaStatus';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const connected: OllamaStatus = {
  state: 'connected',
  version: '0.40.16',
  models: [
    { name: 'gemma3:latest', size: 3_350_000_000, parameterSize: '4.3B' },
    { name: 'phi3:mini', size: 2_180_000_000, parameterSize: '3.8B' },
  ],
};

let root: Root;
let container: HTMLDivElement;

function render(model: string, status: OllamaStatus, onChange = vi.fn(), onRefresh = vi.fn()) {
  act(() =>
    root.render(
      <MemoryRouter>
        <ModelPicker model={model} status={status} onChange={onChange} onRefresh={onRefresh} />
      </MemoryRouter>,
    ),
  );
  return { onChange, onRefresh };
}

const pill = () => container.querySelector<HTMLButtonElement>('button[aria-haspopup=menu]')!;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('shortModelName', () => {
  it('drops the :latest tag only', () => {
    expect(shortModelName('gemma3:latest')).toBe('gemma3');
    expect(shortModelName('phi3:mini')).toBe('phi3:mini');
  });
});

describe('ModelPicker', () => {
  it('shows the saved model, or the automatic pick when none is saved', () => {
    render('phi3:mini', connected);
    expect(pill().textContent).toBe('phi3:mini');
    render('', connected);
    expect(pill().textContent).toBe('gemma3');
  });

  it('opens a menu of installed models, re-reading them from Ollama', () => {
    const { onRefresh } = render('gemma3:latest', connected);
    act(() => pill().click());
    const items = [...container.querySelectorAll('[role=menuitemradio]')];
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining('gemma3:latest'),
      expect.stringContaining('phi3:mini'),
    ]);
    expect(items[0].getAttribute('aria-checked')).toBe('true');
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('chooses a model and closes', () => {
    const { onChange } = render('gemma3:latest', connected);
    act(() => pill().click());
    act(() => (container.querySelectorAll('[role=menuitemradio]')[1] as HTMLElement).click());
    expect(onChange).toHaveBeenCalledWith('phi3:mini');
    expect(container.querySelector('[role=menu]')).toBeNull();
  });

  it('explains when models cannot be loaded', () => {
    render('gemma3:latest', { state: 'error', error: new Error('x') });
    act(() => pill().click());
    expect(container.textContent).toContain('Couldn’t load models');
  });
});
