import type { StorybookConfig } from '@storybook/react-vite';
import type { PluginOption } from 'vite';

/**
 * Plugins from `vite.config.ts` that belong to the app build, not to Storybook:
 * the type-check overlay, the bundle visualizer, and the dev-server middleware
 * that writes the Figma link registry.
 */
const appOnlyPlugins = new Set(['vite-plugin-checker', 'visualizer', 'kilowatt-figma-links']);

function withoutAppPlugins(plugins: PluginOption[] = []): PluginOption[] {
  return plugins.flat(Infinity as 1).filter((plugin) => {
    if (!plugin || typeof plugin !== 'object' || !('name' in plugin)) return true;
    return !appOnlyPlugins.has(plugin.name);
  });
}

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
    '@storybook/addon-vitest',
    // The test toolset turns on once the Vitest story project is set up.
    { name: '@storybook/addon-mcp', options: { toolsets: { dev: true, docs: true, test: false } } },
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
  async viteFinal(config) {
    return { ...config, plugins: withoutAppPlugins(config.plugins) };
  },
};

export default config;
