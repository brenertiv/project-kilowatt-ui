import { useEffect, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { useFixtureSelect } from 'react-cosmos/client';
import { AppProviders, ToastOutlet } from './AppProviders';
import { useTheme } from './theme/ThemeProvider';
import type { ColorScheme } from './tokens';

/**
 * Root decorator: wraps every fixture under `src/` in the same provider stack
 * the app shell uses, plus a memory router so links and route hooks work,
 * and one `scheme` select so light and dark are a control in every fixture.
 */

const schemes: ColorScheme[] = ['light', 'dark'];

function SchemeControl({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useTheme();
  const [scheme] = useFixtureSelect('scheme', { options: schemes, defaultValue: colorScheme });
  useEffect(() => {
    setColorScheme(scheme);
  }, [scheme, setColorScheme]);
  return children;
}

export default function RootDecorator({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <MemoryRouter>
        <SchemeControl>
          <div className="cosmos-stage">{children}</div>
          <ToastOutlet />
        </SchemeControl>
      </MemoryRouter>
    </AppProviders>
  );
}
