import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { normalizeFigmaLinks, serializeFigmaLinks } from './src/figma/url';
import { storyDeps } from './src/test/storyDeps';

const isVitest = Boolean(process.env.VITEST);

/**
 * Lets the app write the Figma link registry back to `src/figma/links.json`
 * while the dev server runs, so a link pasted on the System page lands in the
 * working tree as an ordinary edit. `PUT /__figma/links` takes the whole
 * registry, validates it and writes it in canonical form. Dev server only.
 */
function figmaLinks(): Plugin {
  const file = fileURLToPath(new URL('./src/figma/links.json', import.meta.url));
  return {
    name: 'kilowatt-figma-links',
    configureServer(server) {
      server.middlewares.use('/__figma/links', (request, response, next) => {
        if (request.method !== 'PUT') return next();
        let body = '';
        request.setEncoding('utf8');
        request.on('data', (chunk: string) => {
          body += chunk;
          if (body.length > 1_000_000) request.destroy();
        });
        request.on('end', () => {
          try {
            writeFileSync(file, serializeFigmaLinks(normalizeFigmaLinks(JSON.parse(body))));
            response.statusCode = 204;
            response.end();
          } catch (error) {
            response.statusCode = 400;
            response.setHeader('content-type', 'text/plain; charset=utf-8');
            response.end(error instanceof Error ? error.message : String(error));
          }
        });
      });
    },
  };
}

const pagesBase = process.env.GITHUB_PAGES === 'true' ? '/project-kilowatt-ui/' : '/';

export default defineConfig({
  base: pagesBase,
  resolve: {
    // `src/...` resolves from the repository root, so stories and the import lines
    // agents copy from the manifest use the same path anywhere in the tree.
    alias: [{ find: /^src\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) }],
  },
  plugins: [
    react(),
    svgr(),
    figmaLinks(),
    !isVitest &&
      checker({
        overlay: { initialIsOpen: false },
        typescript: true,
      }),
    visualizer({ filename: 'dist/stats.html', gzipSize: true, emitFile: true }),
  ].filter(Boolean),
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
