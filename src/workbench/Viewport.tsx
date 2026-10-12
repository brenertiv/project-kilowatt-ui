import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type ViewportSize = { width: number; height: number } | null;

type ViewportContextValue = {
  size: ViewportSize;
  request: (size: ViewportSize) => void;
};

export const ViewportContext = createContext<ViewportContextValue | null>(null);

/**
 * Wraps a fixture to open it at a given resolution, after Cosmos's `<Viewport>`.
 * Outside the workbench it renders its children unchanged.
 */
export function Viewport({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const request = useContext(ViewportContext)?.request;
  useEffect(() => {
    request?.({ width, height });
    return () => request?.(null);
  }, [request, width, height]);
  return <>{children}</>;
}

export function sameSize(a: ViewportSize, b: ViewportSize) {
  return a === b || (!!a && !!b && a.width === b.width && a.height === b.height);
}

export const viewportPresets: { label: string; size: ViewportSize }[] = [
  { label: 'Fit', size: null },
  { label: 'Phone', size: { width: 375, height: 812 } },
  { label: 'Tablet', size: { width: 768, height: 1024 } },
  { label: 'Laptop', size: { width: 1280, height: 800 } },
];
