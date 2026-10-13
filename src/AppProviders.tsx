import type { ReactNode } from 'react';
import { Toast } from '@base-ui/react/toast';
import { Tooltip } from '@base-ui/react/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { MuiProvider } from './mui/MuiProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { XIcon } from './icons';

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className="ui-toast">
      <Toast.Content className="ui-toast-content">
        <div>
          <Toast.Title className="ui-popup-title" />
          <Toast.Description className="ui-description" />
        </div>
        <Toast.Close className="ui-icon-btn" aria-label="Dismiss">
          <XIcon />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

/** The toast outlet. Render once, inside `AppProviders`, wherever toasts should appear. */
export function ToastOutlet() {
  return (
    <Toast.Portal>
      <Toast.Viewport className="ui-toast-viewport">
        <ToastList />
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/**
 * The one provider stack: query client, theme, Material bridge, toasts and
 * tooltips. The app shell and the Cosmos root decorator both use it, so a
 * fixture sees exactly what a page sees. Routing is the caller's: the app
 * mounts a BrowserRouter, Cosmos a MemoryRouter.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MuiProvider>
          <Toast.Provider>
            <Tooltip.Provider>{children}</Tooltip.Provider>
          </Toast.Provider>
        </MuiProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
