import { Field } from '@base-ui/react/field';
import { Switch } from '@base-ui/react/switch';
import { Toast } from '@base-ui/react/toast';
import { Tooltip } from '@base-ui/react/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { queryClient } from './api/queryClient';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { ThemeEditor } from './theme/ThemeEditor';
import { Gallery } from './gallery/Gallery';
import { DesignSystem } from './designSystem/DesignSystem';
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

function DarkModeToggle() {
  const { colorScheme, setColorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Field.Root className="topbar-theme">
      <Field.Label>Dark mode</Field.Label>
      <Switch.Root
        className="ui-switch"
        checked={isDark}
        onCheckedChange={(checked) => setColorScheme(checked ? 'dark' : 'light')}
      >
        <Switch.Thumb className="ui-switch-thumb" />
      </Switch.Root>
    </Field.Root>
  );
}

function MainNav() {
  const { t } = useTranslation();

  return (
    <nav className="topbar-nav" aria-label={t('nav.label')}>
      <NavLink to="/components" end className="topbar-nav-link">
        {t('nav.components')}
      </NavLink>
      <NavLink to="/design-system" className="topbar-nav-link">
        {t('nav.designSystem')}
      </NavLink>
    </nav>
  );
}

function Shell() {
  return (
    <div className="root">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          Kilowatt
        </div>
        <MainNav />
        <div className="topbar-actions">
          <ThemeEditor />
          <DarkModeToggle />
        </div>
      </header>
      <div className="workspace">
        <Routes>
          <Route path="/" element={<Navigate to="/components" replace />} />
          <Route path="/components" element={<Gallery />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="*" element={<Navigate to="/components" replace />} />
        </Routes>
      </div>
      <Toast.Portal>
        <Toast.Viewport className="ui-toast-viewport">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toast.Provider>
          <Tooltip.Provider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Shell />
            </BrowserRouter>
          </Tooltip.Provider>
        </Toast.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
