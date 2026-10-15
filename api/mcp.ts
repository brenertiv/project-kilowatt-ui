import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createStorybookMcpHandler } from '@storybook/mcp';

/**
 * The remote MCP endpoint for the deployed Storybook, served at `/mcp` (a rewrite in
 * vercel.json). It runs the docs toolset of `@storybook/mcp` (`docs-list`, `docs-show`,
 * `docs-show-story`) over the manifests from the same build, which vercel.json bundles
 * into this function. So the endpoint always matches the Storybook deployed beside it
 * and never fetches through the deployment's own protection.
 *
 * Access is Vercel Deployment Protection, as for the rest of the site. People get in
 * through the team's login; agents send the project's Protection Bypass for Automation
 * secret as `x-vercel-protection-bypass`. See docs/publishing.md.
 */

/**
 * The manifests from the build. On Vercel the function runs from the project root, where the
 * files from `includeFiles` keep their paths. Pointing at the manifests folder, not the whole
 * build, keeps the file tracer from copying the entire site into the function.
 */
const manifestsDir = join(process.cwd(), 'storybook-static', 'manifests');

// Manifests never change within a deployment, so each is read once per instance.
const manifests = new Map<string, Promise<string>>();

function readManifest(path: string): Promise<string> {
  let text = manifests.get(path);
  if (!text) {
    // The tools ask for `./manifests/components.json` and `./manifests/docs.json`.
    text = readFile(join(manifestsDir, path.replace(/^(\.\/)?manifests\//, '')), 'utf8');
    manifests.set(path, text);
    // A failed read is not kept, so the next call retries.
    text.catch(() => manifests.delete(path));
  }
  return text;
}

const mcp = createStorybookMcpHandler({ manifestProvider: (_request, path) => readManifest(path) });

/** MCP's streamable HTTP transport: POST for messages, GET for the event stream, DELETE to end a session. */
async function handle(request: Request): Promise<Response> {
  return (await mcp)(request);
}

export { handle as DELETE, handle as GET, handle as POST };
