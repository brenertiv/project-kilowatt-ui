import { Toggle } from '@base-ui/react/toggle';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AppProviders, ToastOutlet } from './AppProviders';
import { useTheme } from './theme/ThemeProvider';
import { ThemeEditor } from './theme/ThemeEditor';
import { DesignSystem } from './designSystem/DesignSystem';
import { ArrowOutwardIcon, DarkModeIcon, LightModeIcon } from './icons';
import EnertivAvatar from './assets/enertiv-avatar.svg?react';

/**
 * Components, foundations and guides are documented in Storybook (`npm run storybook`). The dev server
 * links to the local one; a build links to `VITE_STORYBOOK_URL` when it is set.
 */
const storybookUrl: string | null =
  (import.meta.env.VITE_STORYBOOK_URL as string | undefined) ?? (import.meta.env.DEV ? 'http://localhost:6006' : null);

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
      <NavLink to="/design-system" className="topbar-nav-link">
        {t('nav.designSystem')}
      </NavLink>
      {storybookUrl ? (
        <a href={storybookUrl} className="topbar-nav-link" target="_blank" rel="noreferrer">
          {t('nav.components')}
          <ArrowOutwardIcon />
        </a>
      ) : null}
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
          <Route path="/" element={<Navigate to="/design-system" replace />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="*" element={<Navigate to="/design-system" replace />} />
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
