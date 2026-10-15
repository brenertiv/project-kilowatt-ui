import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { createKilowattMcp } from './handler.ts';

/**
 * Runs the Kilowatt Storybook MCP endpoint on Node. Configured by environment:
 *
 *   STORYBOOK_URL  the published Storybook to read manifests from
 *                  (default https://brenertiv.github.io/project-kilowatt-ui/)
 *   STORYBOOK_DIR  a local `storybook build` output instead, e.g. ../storybook-static
 *   MCP_TOKEN      require `Authorization: Bearer <token>` (unset: open)
 *   PORT           default 8787
 *
 *   node server.ts
 */

const port = Number(process.env.PORT ?? 8787);
const source = process.env.STORYBOOK_DIR
  ? { dir: process.env.STORYBOOK_DIR }
  : { url: process.env.STORYBOOK_URL ?? 'https://brenertiv.github.io/project-kilowatt-ui/' };

const handle = await createKilowattMcp({ source, token: process.env.MCP_TOKEN || undefined });

function toRequest(incoming: IncomingMessage): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else if (value !== undefined) headers.set(name, value);
  }
  const hasBody = incoming.method !== 'GET' && incoming.method !== 'HEAD';
  return new Request(new URL(incoming.url ?? '/', `http://${incoming.headers.host ?? 'localhost'}`), {
    method: incoming.method,
    headers,
    body: hasBody ? (Readable.toWeb(incoming) as ReadableStream) : undefined,
    // Node needs this to send a streamed body.
    duplex: hasBody ? 'half' : undefined,
  } as RequestInit);
}

async function send(response: Response, outgoing: ServerResponse) {
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) return outgoing.end();
  // Streamed, so server-sent events reach the client as they are written.
  Readable.fromWeb(response.body as import('node:stream/web').ReadableStream).pipe(outgoing);
}

createServer((incoming, outgoing) => {
  handle(toRequest(incoming))
    .then((response) => send(response, outgoing))
    .catch((error: unknown) => {
      console.error(error);
      if (!outgoing.headersSent) outgoing.writeHead(500, { 'content-type': 'text/plain' });
      outgoing.end('Internal error');
    });
}).listen(port, () => {
  const from = 'dir' in source ? source.dir : source.url;
  console.log(`Kilowatt Storybook MCP on http://localhost:${port}/mcp, manifests from ${from}`);
});
