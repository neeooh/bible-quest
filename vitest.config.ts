import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests don't load the PWA / Tailwind plugins.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    unstubGlobals: true,
    // Don't let a developer's .env.local change app defaults in tests. Tests
    // that need the hosted AI stub these themselves.
    env: { VITE_AI_API_URL: '', VITE_TURNSTILE_SITE_KEY: '' },
  },
});
