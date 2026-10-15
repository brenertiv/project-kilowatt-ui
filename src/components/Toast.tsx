import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';

/** One toast: a short title, and optionally a line of detail. */
export type ToastMessage = {
  /** What happened, in a few words. */
  title: ReactNode;
  /** Optional detail under the title. */
  description?: ReactNode;
};

type ToastApi = {
  /** Shows a toast. Toasts queue: each shows for a few seconds, one at a time. */
  add: (toast: ToastMessage) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

type Queued = ToastMessage & { id: number };

export type ToastProviderProps = {
  /** The part of the app that can show toasts. `AppProviders` wraps everything, so components never mount their own. */
  children: ReactNode;
};

/**
 * Toasts for brief confirmation that something happened, on MUI's Snackbar.
 * `AppProviders` mounts it once; call `useToast().add({ title })` anywhere below.
 *
 * @summary Brief, self-dismissing confirmations, queued one at a time.
 * @import import { ToastProvider, useToast } from 'src/components/Toast';
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [queue, setQueue] = useState<Queued[]>([]);
  const [open, setOpen] = useState(true);
  const current = queue[0];

  const add = useCallback((toast: ToastMessage) => {
    setQueue((items) => [...items, { ...toast, id: Date.now() + Math.random() }]);
    setOpen(true);
  }, []);
  const api = useMemo(() => ({ add }), [add]);

  const close = (_event?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        key={current?.id}
        open={Boolean(current) && open}
        autoHideDuration={5000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        // After a toast leaves, show the next one in the queue.
        slotProps={{
          transition: {
            onExited: () => {
              setQueue((items) => items.slice(1));
              setOpen(true);
            },
          },
        }}
      >
        <Alert severity="info" variant="filled" onClose={close} sx={{ width: '100%' }}>
          {current?.description ? <AlertTitle>{current.title}</AlertTitle> : current?.title}
          {current?.description}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside ToastProvider (AppProviders mounts one)');
  return toast;
}
