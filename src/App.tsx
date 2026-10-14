import { Toggle } from '@base-ui/react/toggle';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AppProviders, ToastOutlet } from './AppProviders';
import { useTheme } from './theme/ThemeProvider';
import { ThemeEditor } from './theme/ThemeEditor';
import { DesignSystem } from './designSystem/DesignSystem';
import { DocsPage } from './docs/DocsPage';
import { DarkModeIcon, LightModeIcon } from './icons';
import { Workbench } from './workbench/Workbench';
import EnertivAvatar from './assets/enertiv-avatar.svg?react';

/** The workbench used to live at /workbench; keep those links working. */
function LegacyWorkbenchRedirect() {
  const rest = useParams()['*'] ?? '';
  return <Navigate to={`/components/${rest}`} replace />;
}

function DarkModeToggle() {
  const { colorScheme, setColorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Toggle
      className="ui-icon-btn topbar-scheme"
      pressed={isDark}
      onPressedChange={(pressed) => setColorScheme(pressed ? 'dark' : 'light')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <DarkModeIcon fill /> : <LightModeIcon />}
    </Toggle>
  );
}

function MainNav() {
  const { t } = useTranslation();

  return (
    <nav className="topbar-nav" aria-label={t('nav.label')}>
      <NavLink to="/components" className="topbar-nav-link">
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
          <Route path="/components" element={<Workbench />} />
          <Route path="/components/:slug" element={<Workbench />} />
          <Route path="/components/:slug/:name" element={<Workbench />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:slug" element={<DocsPage />} />
          <Route path="/workbench/*" element={<LegacyWorkbenchRedirect />} />
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
