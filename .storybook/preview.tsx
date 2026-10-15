import { useEffect, useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import type { Decorator, Preview } from '@storybook/react-vite';
import { AppProviders, ToastOutlet } from '../src/AppProviders';
import { createQueryClient } from '../src/api/queryClient';
import { installBreakpointStyles } from '../src/breakpoints';
import { a11yRules } from '../src/stories/a11y';
import { withMockApi } from '../src/stories/decorators';
import { useTheme } from '../src/theme/ThemeProvider';
import type { ColorScheme } from '../src/tokens';
import '../src/i18n';
import '../src/styles.css';

installBreakpointStyles();

// The theme provider persists its state in localStorage. Start every Storybook session
// from the shipped theme so docs and visual tests show the real defaults.
try {
  localStorage.removeItem('kilowatt-theme');
} catch {
  // Storage can be unavailable (private mode, sandboxed iframes); the defaults apply anyway.
}

/** Follows the `scheme` toolbar global. The theme lives on <html>, so one scheme applies to the whole canvas. */
function SchemeSync({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const { colorScheme, setColorScheme } = useTheme();
  useEffect(() => {
    if (scheme !== colorScheme) setColorScheme(scheme);
  }, [scheme, colorScheme, setColorScheme]);
  return children;
}

/**
 * What a page sees in the app: the provider stack, a router, and the toast
 * outlet. Each story gets its own query client so cached data never carries
 * from one story to the next.
 */
function StoryProviders({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return (
    <AppProviders client={client}>
      <MemoryRouter>
        <SchemeSync scheme={scheme}>
          {children}
          <ToastOutlet />
        </SchemeSync>
      </MemoryRouter>
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
  initialGlobals: { scheme: 'light' },
  parameters: {
    docs: {
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
        order: [
          'Introduction',
          'Guides',
          ['Rules', 'Writing stories', '*'],
          'Foundations',
          ['Color', 'Typography', 'Space', 'Shape', 'Layout', 'Icons', 'Primitives'],
          'Primitives',
          'Data',
          'Table',
          'Charts',
          'Menus',
          'Patterns',
          'Pages',
          'Internal',
        ],
      },
    },
    controls: { expanded: true, sort: 'requiredFirst' },
    a11y: {
      // Any axe violation fails the story test. Stories whose only failures are Figma-owned
      // token pairs turn color-contrast off one by one (src/stories/a11y.ts); the open pairs
      // are listed in docs/storybook-plan.md.
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
