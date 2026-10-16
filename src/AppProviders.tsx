import type { ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { MuiProvider } from './mui/MuiProvider';

/**
 * The one provider stack: query client and the Material UI theme. The app shell
 * and Storybook both use it, so a story sees exactly what a page sees. `client`
 * defaults to the app's shared query client.
 */
export function AppProviders({ children, client = queryClient }: { children: ReactNode; client?: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <MuiProvider>{children}</MuiProvider>
    </QueryClientProvider>
  );
}
