import { useSyncExternalStore } from 'react';
import initial from './links.json';
import { normalizeFigmaLinks, parseFigmaUrl, type FigmaLinks } from './url';

/**
 * The Figma link registry as the app sees it. `links.json` is the source of
 * truth and is committed; this module holds it in memory, updates when the
 * file changes on disk (HMR), and writes edits back through the dev server.
 */

/** Dev-server route that writes `links.json`; see the `figmaLinks` plugin in `vite.config.ts`. */
export const figmaLinksEndpoint = '/__figma/links';

/** Edits reach the repository only through the dev server, so the production build is read-only. */
export const figmaLinksEditable = import.meta.env.DEV;

export type FigmaScope = { kind: 'file' } | { kind: 'component'; slug: string };

let state: FigmaLinks = normalizeFigmaLinks(initial);
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useFigmaLinks(): FigmaLinks {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function linkFor(links: FigmaLinks, scope: FigmaScope): string | null {
  return scope.kind === 'file' ? links.file : (links.components[scope.slug] ?? null);
}

/** The registry with one link set or cleared. Pure, so the result can be checked before it is written. */
export function withLink(links: FigmaLinks, scope: FigmaScope, url: string | null): FigmaLinks {
  if (scope.kind === 'file') return normalizeFigmaLinks({ ...links, file: url });
  const components = { ...links.components };
  if (url) components[scope.slug] = url;
  else delete components[scope.slug];
  return normalizeFigmaLinks({ ...links, components });
}

/** Parses, writes the registry to disk through the dev server, then updates every subscriber. */
export async function setFigmaLink(scope: FigmaScope, url: string | null): Promise<void> {
  if (!figmaLinksEditable) throw new Error('Figma links can only be edited from the dev server.');
  if (url !== null && !parseFigmaUrl(url)) throw new Error('Not a Figma link.');
  const next = withLink(state, scope, url);
  const response = await fetch(figmaLinksEndpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(next),
  });
  if (!response.ok) throw new Error((await response.text()) || response.statusText);
  state = next;
  emit();
}

// A change to links.json on disk (an edit, a checkout, another browser saving) updates the app in place.
if (import.meta.hot) {
  import.meta.hot.accept('./links.json', (module) => {
    if (!module) return;
    try {
      state = normalizeFigmaLinks(module.default);
      emit();
    } catch (error) {
      console.error('src/figma/links.json is not a valid registry', error);
    }
  });
}
