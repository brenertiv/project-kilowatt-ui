import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';

const isVitest = Boolean(process.env.VITEST);
const pagesBase = process.env.GITHUB_PAGES === 'true' ? '/project-kilowatt-ui/' : '/';

export default defineConfig({
  base: pagesBase,
  plugins: [
    react(),
    svgr(),
    !isVitest &&
      checker({
        overlay: { initialIsOpen: false },
        typescript: true,
      }),
    visualizer({ filename: 'dist/stats.html', gzipSize: true, emitFile: true }),
  ].filter(Boolean),
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
