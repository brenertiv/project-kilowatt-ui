import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTheme, type Breakpoint } from '@mui/material/styles';

const ContentWidth = createContext<number | null>(null);

/** An element's content box width: its padding left out. */
function contentBoxWidth(element: HTMLElement) {
  const style = getComputedStyle(element);
  return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}

/**
 * Measures the element given `measure` as its `ref` (its content box, padding left out) and hands the
 * width to the pages inside it through `provide`, so `useContentUp` can answer against it. `AppShell`
 * does this for `main`; an app needs it only for a frame of its own. A callback ref, so an element
 * that mounts later is measured too.
 *
 * @summary Measure a page area's width and provide it to `useContentUp`.
 * @import import { useContentWidth } from 'src/components/contentWidth';
 */
export function useContentWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  // Measured in the ref, before the first paint, so a page never lays out at the window's width and then jumps.
  const measure = useCallback((node: T | null) => {
    setElement(node);
    if (node) setWidth(contentBoxWidth(node));
  }, []);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  const provide = (children: ReactNode) => <ContentWidth.Provider value={width}>{children}</ContentWidth.Provider>;
  return { measure, provide, element };
}

/**
 * Whether the page's content area is at least the theme breakpoint `key` wide, or `key` pixels, as MUI's
 * `breakpoints.up` also takes: `useMediaQuery(theme.breakpoints.up(key))`, asked of the page rather than
 * the window. Outside `AppShell` it reads the window's width.
 *
 * @summary Whether the page's content area reaches a breakpoint, for a page beside docked panels.
 * @import import { useContentUp } from 'src/components/contentWidth';
 */
export function useContentUp(key: Breakpoint | number) {
  const width = useContext(ContentWidth);
  const theme = useTheme();
  const available = width ?? (typeof window === 'undefined' ? 0 : window.innerWidth);
  return available >= (typeof key === 'number' ? key : theme.breakpoints.values[key]);
}
