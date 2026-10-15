import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storyDeps } from './src/test/storyDeps';

/**
 * Shared by Storybook (which merges it into its own Vite config) and Vitest.
 * There is no app build: Storybook is the only thing this repository ships.
 */
export default defineConfig({
  resolve: {
    // `src/...` resolves from the repository root, so stories and the import lines
    // agents copy from the manifest use the same path anywhere in the tree.
    alias: [{ find: /^src\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) }],
  },
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: './src/test/setup.ts',
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        // Renders every story in Chromium: a smoke test, any play function, and an axe check.
        extends: true,
        plugins: [storybookTest({ configDir: fileURLToPath(new URL('./.storybook', import.meta.url)) })],
        // Pre-bundle every story dependency up front, so Vite never re-optimizes and
        // reloads mid-run (see src/test/storyDeps.ts).
        optimizeDeps: { include: storyDeps },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
