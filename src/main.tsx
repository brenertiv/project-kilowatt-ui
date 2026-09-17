import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installBreakpointStyles } from './breakpoints';
import './i18n';
import './styles.css';

installBreakpointStyles();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
