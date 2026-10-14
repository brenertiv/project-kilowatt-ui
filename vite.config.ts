import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';
import { normalizeFigmaLinks, serializeFigmaLinks } from './src/figma/url';

const isVitest = Boolean(process.env.VITEST);

/**
 * Lets the app write the Figma link registry back to `src/figma/links.json`
 * while the dev server runs, so a link pasted in the workbench lands in the
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

/**
 * Fixtures import `react-cosmos/client`. The in-app workbench serves that API
 * from `src/fixtures/client.tsx`; `COSMOS=1` (set by the cosmos scripts) leaves
 * the specifier alone so the real package answers inside React Cosmos.
 */
const useCosmosClient = Boolean(process.env.COSMOS);
const pagesBase = process.env.GITHUB_PAGES === 'true' ? '/project-kilowatt-ui/' : '/';

export default defineConfig({
  base: pagesBase,
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
  resolve: {
    alias: useCosmosClient
      ? []
      : [
          {
            find: /^react-cosmos\/client$/,
            replacement: fileURLToPath(new URL('./src/fixtures/client.tsx', import.meta.url)),
          },
        ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
