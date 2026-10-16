import { addons } from 'storybook/manager-api';
import { schemeOf, systemScheme, themes } from './themes';

/**
 * The Storybook interface follows the Scheme toolbar, so switching it to dark turns
 * the sidebar, toolbar and panels dark along with the stories. Before the preview
 * reports its globals, the interface starts from the system setting, which is also
 * the toolbar's default (preview.tsx).
 */
addons.setConfig({
  theme: themes[systemScheme()],
  sidebar: {
    // Specimen stories are embedded in the Foundations pages, not browsed on their own. They
    // stay in the index (a `!dev` tag would drop them and break those pages' Canvas blocks)
    // and are only hidden here.
    filters: { patterns: (item) => !item.tags?.includes('specimen') },
  },
});

addons.register('kilowatt/scheme', (api) => {
  const follow = ({ globals }: { globals?: Record<string, unknown> }) => {
    api.setOptions({ theme: themes[schemeOf(globals)] });
  };
  // setGlobals carries the starting globals (including any in the URL); globalsUpdated each change.
  api.on('setGlobals', follow);
  api.on('globalsUpdated', follow);
});
