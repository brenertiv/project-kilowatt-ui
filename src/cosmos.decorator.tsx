import type { ReactNode } from 'react';

/**
 * Root decorator: wraps every fixture under `src/`. Theme, toast, tooltip and
 * router providers already come from the app shell, so this only supplies the
 * stage padding and a surface to sit on.
 */
export default function RootDecorator({ children }: { children: ReactNode }) {
  return <div className="workbench-stage-inner">{children}</div>;
}
