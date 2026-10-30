import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type PageScroll = {
  /** The element that scrolls the page, or `null` for the window. */
  root: HTMLElement | null;
  /** The pinned content's `top`, as CSS: minus `main`'s top padding, which sticky content otherwise stops under, or the phone header's height. */
  top: string;
  /** Where pinned content sits, in pixels below the top of `root`'s box or of the window: 0, or the phone header's height. */
  edge: number;
  /** `main`'s side padding in theme spacing units, which a pinned band reaches across. */
  inset: number;
};

const PageScrollContext = createContext<PageScroll>({ root: null, top: '0px', edge: 0, inset: 3 });

/** Set by `AppShell`: what scrolls the page (`main` on wide screens, the window on phones), and where pinned content sits. */
export const PageScrollProvider = PageScrollContext.Provider;

/** Where the shell pins a page's content. Outside `AppShell`, the window with nothing above it. */
export const usePageScroll = () => useContext(PageScrollContext);

/** An element's border-box height, kept current, for the phone header a page's band pins under. Pass `measure` as its `ref`. */
export function useElementHeight<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [height, setHeight] = useState(0);
  const measure = useCallback((node: T | null) => {
    setElement(node);
    if (node) setHeight(node.offsetHeight);
  }, []);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { measure, height };
}

/**
 * Whether a band that starts `overlap`'s height above `sentinel` in the page (it overlaps what comes before by that
 * much) has reached the line pinned content sits on: whether the sentinel has passed above that line plus the overlap.
 * An `IntersectionObserver`, so it follows the layout as well as the scroll, and never feeds back into what it measures.
 *
 * @summary Whether a sticky band has reached the line where the page pins it.
 * @import import { usePinned } from 'src/components/pageScroll';
 */
export function usePinned(sentinel: HTMLElement | null, overlap: HTMLElement | null) {
  const { root, edge } = usePageScroll();
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (!sentinel || !overlap) return;
    const observer = new IntersectionObserver(([entry]) => setPinned(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)), {
      root,
      rootMargin: `${-(edge + overlap.offsetHeight)}px 0px 0px 0px`,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, overlap, root, edge]);
  return pinned;
}
