/**
 * Cloudflare Turnstile: an invisible check that the hosted AI is being used
 * from a real browser. Only runs when VITE_TURNSTILE_SITE_KEY is set.
 */

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      'timeout-callback'?: () => void;
    },
  ): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ?? '';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TIMEOUT_MS = 20_000;

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load the security check.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function isTurnstileEnabled(): boolean {
  return SITE_KEY !== '';
}

/** A one-time token proving this is a browser, or "" when the check is off. */
export async function getTurnstileToken(): Promise<string> {
  if (!SITE_KEY) return '';
  const turnstile = await loadScript();
  const container = document.createElement('div');
  // With the widget set to "Invisible" in the Cloudflare dashboard nothing
  // shows. In "Managed" mode a checkbox may appear here when Cloudflare is unsure.
  container.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:100';
  document.body.appendChild(container);

  try {
    return await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('The security check timed out.')), TIMEOUT_MS);
      const fail = () => {
        clearTimeout(timer);
        reject(new Error('The security check failed.'));
      };
      const id = turnstile.render(container, {
        sitekey: SITE_KEY,
        callback: (token) => {
          clearTimeout(timer);
          resolve(token);
          setTimeout(() => turnstile.remove(id), 0);
        },
        'error-callback': fail,
        'timeout-callback': fail,
      });
    });
  } finally {
    setTimeout(() => container.remove(), 0);
  }
}
