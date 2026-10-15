import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import type { Decorator, Preview } from '@storybook/react-vite';
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { addons } from 'storybook/preview-api';
import { schemeOf, systemScheme, themes, type Scheme } from './themes';
import { AppProviders, ToastOutlet } from '../src/AppProviders';
import { createQueryClient } from '../src/api/queryClient';
import { installBreakpointStyles } from '../src/breakpoints';
import { installTokenStyles } from '../src/theme/tokenStyles';
import { a11yRules } from '../src/stories/a11y';
import { withMockApi } from '../src/stories/decorators';
import { useKilowattTheme } from '../src/theme/useKilowattTheme';
import type { ColorScheme } from '../src/tokens';
import '../src/i18n';
import '../src/styles.css';

installTokenStyles();
installBreakpointStyles();

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

/** Docs pages in the Kilowatt theme for the current scheme, so they turn dark with the stories. */
function SchemeDocsContainer(props: DocsContainerProps & { children?: ReactNode }) {
  const scheme = useSyncExternalStore(
    (listener) => {
      docsSchemeListeners.add(listener);
      return () => docsSchemeListeners.delete(listener);
    },
    () => docsScheme,
  );
  return <DocsContainer {...props} theme={themes[scheme]} />;
}

/** Follows the `scheme` toolbar global. The theme lives on <html>, so one scheme applies to the whole canvas. */
function SchemeSync({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const { scheme: current, setScheme } = useKilowattTheme();
  useEffect(() => {
    if (scheme !== current) setScheme(scheme);
  }, [scheme, current, setScheme]);
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

/**
 * The toolbar's grid toggle, drawn in Kilowatt's cyan on its spacing: 8px cells (--space)
 * with a heavier line every 32px. Storybook's own grid only draws gray, so its lines are
 * set transparent (parameters.backgrounds.grid) and this draws over the same element:
 * the story's page in canvas view, each story preview on a docs page.
 */
const GRID_RGB = '46, 166, 225'; // color/brand/500
const GRID_MINOR = 0.06;
const GRID_MAJOR = 0.13;

function gridCss(selector: string, offset: number) {
  const line = (alpha: number, angle = '') => `linear-gradient(${angle}rgba(${GRID_RGB}, ${alpha}) 1px, transparent 1px)`;
  const at = `${offset}px ${offset}px`;
  return `${selector} {
    background-image: ${line(GRID_MAJOR)}, ${line(GRID_MAJOR, '90deg, ')}, ${line(GRID_MINOR)}, ${line(GRID_MINOR, '90deg, ')} !important;
    background-size: 32px 32px, 32px 32px, 8px 8px, 8px 8px !important;
    background-position: ${at}, ${at}, ${at}, ${at} !important;
    background-blend-mode: normal !important;
  }`;
}

function KilowattGrid({ css, children }: { css: string | null; children: ReactNode }) {
  useEffect(() => {
    if (!css) return;
    const style = document.createElement('style');
    style.dataset.kilowattGrid = '';
    style.textContent = css;
    document.head.appendChild(style);
    return () => style.remove();
  }, [css]);
  return children;
}

const withGrid: Decorator = (Story, { globals, viewMode, id, parameters }) => {
  const backgrounds = globals.backgrounds as { grid?: boolean } | string | undefined;
  const on = typeof backgrounds === 'object' && Boolean(backgrounds?.grid);
  // Same origin as Storybook's grid: the docs preview padding, or the padded layout's 16px.
  const offset = viewMode === 'docs' ? 20 : (parameters.layout ?? 'padded') === 'padded' ? 16 : 0;
  // `html` in front outranks Storybook's own grid rule on the same element.
  const selector =
    viewMode === 'docs'
      ? `html #anchor--${id} .docs-story, html #anchor--primary--${id} .docs-story`
      : 'html body.sb-show-main';
  return (
    <KilowattGrid css={on ? gridCss(selector, offset) : null}>
      <Story />
    </KilowattGrid>
  );
};

const withProviders: Decorator = (Story, context) => (
  <StoryProviders scheme={context.globals.scheme === 'dark' ? 'dark' : 'light'}>
    <Story />
  </StoryProviders>
);

const preview: Preview = {
  // Listed innermost first: the mock switches apply inside the providers.
  decorators: [withMockApi, withProviders, withGrid],
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
    // Storybook's grid lines are transparent; withGrid draws Kilowatt's cyan grid instead.
    backgrounds: { grid: { cellSize: 8, cellAmount: 4, opacity: 0 } },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Guides',
          ['Rules', 'Writing stories', '*'],
          'Foundations',
          ['MUI departures', 'MUI comparison', 'Color', 'Typography', 'Space', 'Shape', 'Layout', 'Icons', 'Primitives'],
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
