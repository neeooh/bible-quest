import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests don't load the PWA / Tailwind plugins.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
