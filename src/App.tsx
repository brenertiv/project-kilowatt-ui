import { Field } from '@base-ui/react/field';
import { Switch } from '@base-ui/react/switch';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AppProviders, ToastOutlet } from './AppProviders';
import { useTheme } from './theme/ThemeProvider';
import { ThemeEditor } from './theme/ThemeEditor';
import { Gallery } from './gallery/Gallery';
import { DesignSystem } from './designSystem/DesignSystem';
import { DocsPage } from './docs/DocsPage';
import EnertivAvatar from './assets/enertiv-avatar.svg?react';

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
      <NavLink to="/docs" className="topbar-nav-link">
        {t('nav.docs')}
      </NavLink>
    </nav>
  );
}

function Shell() {
  return (
    <div className="root">
      <header className="topbar">
        <div className="brand">
          <EnertivAvatar className="brand-mark" aria-hidden="true" />
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
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:slug" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/components" replace />} />
        </Routes>
      </div>
      <ToastOutlet />
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Shell />
      </BrowserRouter>
    </AppProviders>
  );
}
