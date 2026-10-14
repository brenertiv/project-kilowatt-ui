import { useEffect, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { useFixtureSelect } from 'react-cosmos/client';
import { AppProviders, ToastOutlet } from './AppProviders';
import { ChevronLeftIcon } from './icons';
import { useTheme } from './theme/ThemeProvider';
import { useInWorkbench } from './workbench/inputs';
import type { ColorScheme } from './tokens';

/**
 * Root decorator for every fixture under `src/`. The in-app workbench already
 * runs inside the app shell, so there it renders the fixture as is. Under
 * React Cosmos, which mounts fixtures on its own, it supplies the provider
 * stack, a memory router so links and route hooks work, a `scheme` select, and
 * a way back to the library.
 */

const schemes: ColorScheme[] = ['light', 'dark'];

/**
 * Where the component library runs. Cosmos renders fixtures in an iframe on its
 * own origin, so the way back is a top-level link: the dev server in development,
 * or `VITE_LIBRARY_URL` for an exported Cosmos site.
 */
const libraryUrl: string | null =
  (import.meta.env.VITE_LIBRARY_URL as string | undefined) ?? (import.meta.env.DEV ? 'http://localhost:5173/components' : null);

function BackToLibrary() {
  if (!libraryUrl) return null;
  return (
    <a className="ui-btn ui-btn-ghost cosmos-back" href={libraryUrl} target="_top" rel="noreferrer">
      <ChevronLeftIcon />
      Back to library
    </a>
  );
}

function SchemeControl({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useTheme();
  const [scheme] = useFixtureSelect('scheme', { options: schemes, defaultValue: 'light' });
  useEffect(() => {
    if (scheme !== colorScheme) setColorScheme(scheme);
  }, [scheme, colorScheme, setColorScheme]);
  return children;
}

export default function RootDecorator({ children }: { children: ReactNode }) {
  const inWorkbench = useInWorkbench();
  if (inWorkbench) return children;
  return (
    <AppProviders>
      <MemoryRouter>
        <SchemeControl>
          <BackToLibrary />
          <div className="cosmos-stage">{children}</div>
          <ToastOutlet />
        </SchemeControl>
      </MemoryRouter>
    </AppProviders>
  );
}
