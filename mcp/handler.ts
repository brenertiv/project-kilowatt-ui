import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createStorybookMcpHandler } from '@storybook/mcp';

/**
 * The Kilowatt Storybook MCP endpoint, for a published Storybook. It serves the
 * docs toolset (`docs-list`, `docs-show`, `docs-show-story`) from the
 * manifests a `storybook build` writes, read from the published site or from a
 * local build. Fetch API in and out, so any runtime with `Request` can host it.
 */

export type KilowattMcpOptions = {
  /** Where the manifests come from: the published Storybook's URL, or a local build directory. */
  source: { url: string } | { dir: string };
  /** When set, requests must send `Authorization: Bearer <token>`. Leave unset for a public Storybook. */
  token?: string;
  /** How long a fetched manifest is reused, in ms. Defaults to 5 minutes; a new deploy shows up after that. */
  cacheMs?: number;
};

export async function createKilowattMcp({ source, token, cacheMs = 5 * 60_000 }: KilowattMcpOptions) {
  const cache = new Map<string, { at: number; text: Promise<string> }>();

  async function load(path: string): Promise<string> {
    const relative = path.replace(/^\.\//, '');
    if ('dir' in source) return readFile(join(source.dir, relative), 'utf8');
    const response = await fetch(new URL(relative, source.url.endsWith('/') ? source.url : `${source.url}/`));
    if (!response.ok) throw new Error(`${relative}: ${response.status} ${response.statusText}`);
    return response.text();
  }

  const mcp = await createStorybookMcpHandler({
    manifestProvider: (_request, path) => {
      const hit = cache.get(path);
      if (hit && Date.now() - hit.at < cacheMs) return hit.text;
      const text = load(path);
      cache.set(path, { at: Date.now(), text });
      // A failed load is not cached, so the next call retries.
      text.catch(() => cache.delete(path));
      return text;
    },
  });

  return async function handle(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/' || pathname === '/health') {
      return new Response('Kilowatt Storybook MCP. Connect your agent to /mcp.\n', { headers: { 'content-type': 'text/plain' } });
    }
    if (pathname !== '/mcp') return new Response('Not found', { status: 404 });
    if (token && request.headers.get('authorization') !== `Bearer ${token}`) {
      return new Response('Unauthorized', { status: 401, headers: { 'www-authenticate': 'Bearer' } });
    }
    return mcp(request);
  };
}
