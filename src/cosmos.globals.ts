/**
 * What `main.tsx` does for the app, this does for the Cosmos renderer:
 * the stylesheet, the translations and the breakpoint styles. Cosmos loads
 * it once through `globalImports` in `cosmos.config.json`.
 */
import { installBreakpointStyles } from './breakpoints';
import './i18n';
import './styles.css';

installBreakpointStyles();
