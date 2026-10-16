import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useColorScheme } from '@mui/material/styles';
import type { Decorator, Preview } from '@storybook/react-vite';
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { addons } from 'storybook/preview-api';
import { schemeOf, systemScheme, themes, type Scheme } from './themes';
import { AppProviders } from '../src/AppProviders';
import { createQueryClient } from '../src/api/queryClient';
import { a11yRules } from '../src/stories/a11y';
import { withMockApi } from '../src/stories/decorators';
import type { ColorScheme } from '../src/mui/departures';
import '../src/i18n';

/**
 * The Scheme toolbar's current value, for docs pages: they have no decorator of their
 * own, so they listen to the channel. setGlobals carries the starting globals (with any
 * from the URL), globalsUpdated each change.
 */
let docsScheme: Scheme = systemScheme();
const docsSchemeListeners = new Set<() => void>();
const followGlobals = ({ globals }: { globals?: Record<string, unknown> }) => {
  docsScheme = schemeOf(globals);
  docsSchemeListeners.forEach((listener) => listener());
};
addons.getChannel().on('setGlobals', followGlobals);
addons.getChannel().on('globalsUpdated', followGlobals);

/** Docs pages in Storybook's theme for the current scheme, so they turn dark with the stories. */
function SchemeDocsContainer(props: DocsContainerProps & { children?: ReactNode }) {
  const scheme = useSyncExternalStore(
    (listener) => {
      docsSchemeListeners.add(listener);
      return () => docsSchemeListeners.delete(listener);
    },
    () => docsScheme,
  );
  // Storybook draws docs-table cell lines in the theme's border color; preview-head.html
  // draws the table's outer frame in the same color and radius through these variables.
  useEffect(() => {
    const { style } = document.documentElement;
    style.setProperty('--docs-border-color', themes[scheme].appBorderColor);
    style.setProperty('--docs-border-radius', `${themes[scheme].appBorderRadius}px`);
  }, [scheme]);
  return <DocsContainer {...props} theme={themes[scheme]} />;
}

/** Follows the `scheme` toolbar global. The theme lives on <html>, so one scheme applies to the whole canvas. */
function SchemeSync({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const { mode, setMode } = useColorScheme();
  useEffect(() => {
    if (scheme !== mode) setMode(scheme);
  }, [scheme, mode, setMode]);
  return children;
}

/**
 * What a page sees in the app: the provider stack (theme, query client)
 * Each story gets its own query client so cached data never
 * carries from one story to the next.
 */
function StoryProviders({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return (
    <AppProviders client={client}>
      <SchemeSync scheme={scheme}>{children}</SchemeSync>
    </AppProviders>
  );
}

const withProviders: Decorator = (Story, context) => (
  <StoryProviders scheme={context.globals.scheme === 'dark' ? 'dark' : 'light'}>
    <Story />
  </StoryProviders>
);

const preview: Preview = {
  // Listed innermost first: the mock switches apply inside the providers.
  decorators: [withMockApi, withProviders],
  tags: ['autodocs'],
  globalTypes: {
    scheme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  // Start from the viewer's system setting; the toolbar switches from there.
  initialGlobals: { scheme: systemScheme() },
  parameters: {
    docs: {
      container: SchemeDocsContainer,
      // react-docgen leaves a component's JSDoc tags in its description: the manifest
      // reads @summary and @import from there, but the docs page shows only the prose.
      extractComponentDescription: (component: unknown) => {
        const docgen = (component as { __docgenInfo?: { description?: string } } | undefined)?.__docgenInfo;
        return (docgen?.description ?? '').replace(/^@\w+[\s\S]*$/m, '').trim();
      },
    },
    layout: 'padded',
    options: {
      storySort: {
        order: ['Introduction', 'Guides', ['Rules', 'Writing stories', '*'], 'Foundations', ['MUI departures', 'Color', 'Typography', 'Spacing', 'Shape', 'Elevation', 'Layout', 'Z-index', 'Motion', 'Icons'], 'Components'],
      },
    },
    controls: { expanded: true, sort: 'requiredFirst' },
    a11y: {
      // Any axe violation fails the story test.
      test: 'error',
      config: { rules: a11yRules },
    },
    viewport: {
      options: {
        phone: { name: 'Phone', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
        laptop: { name: 'Laptop', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
      },
    },
  },
};

export default preview;
