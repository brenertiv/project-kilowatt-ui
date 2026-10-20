import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // src/docs/generated holds the Foundations and Guides pages written by scripts/build-docs.ts.
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  staticDirs: [
    // The logos and favicon for the Storybook interface (.storybook/manager.ts).
    { from: '../src/assets', to: '/brand' },
    // Roboto as MapLibre glyph files, for basemap labels (src/maps/fonts/README.md).
    { from: '../src/maps/fonts', to: '/map-fonts' },
  ],
  addons: [
    {
      name: '@storybook/addon-docs',
      // GitHub tables, which the guides and foundations pages are full of.
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    // test runs the story tests through @storybook/addon-vitest.
    { name: '@storybook/addon-mcp', options: { toolsets: { dev: true, docs: true, test: true } } },
  ],
  features: {
    // Writes /manifests/components.json and /manifests/docs.json, which the MCP
    // docs tools and the generated llms.txt read.
    componentsManifest: true,
  },
  typescript: {
    // react-docgen, not react-docgen-typescript: in 10.6.2 only this engine honours a
    // component's `@import` JSDoc tag (the import line agents copy from the manifest)
    // and lifts `@summary` into the manifest. It resolves our imported union types
    // too, and skips props inherited from MUI and Base UI, which is what we want.
    reactDocgen: 'react-docgen',
  },
};

export default config;
