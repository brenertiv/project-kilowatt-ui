import type { ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { ToastProvider } from './components/Toast';
import { MuiProvider } from './mui/MuiProvider';

/**
 * The one provider stack: query client, the Material UI theme (which owns the color scheme)
 * and toasts. The app shell and Storybook both use it, so a story sees exactly
 * what a page sees. Routing is the caller's: the app mounts a BrowserRouter,
 * Storybook a MemoryRouter. `client`
 * defaults to the app's shared query client.
 */
export function AppProviders({ children, client = queryClient }: { children: ReactNode; client?: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <MuiProvider>
        <ToastProvider>{children}</ToastProvider>
      </MuiProvider>
    </QueryClientProvider>
  );
}
