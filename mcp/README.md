# Kilowatt Storybook MCP

This is the remote MCP endpoint for the published Storybook. Agents that don't run Storybook locally connect here. It serves the docs toolset of `@storybook/mcp`:

- `docs-list`
- `docs-show`
- `docs-show-story`

The data comes from the manifests a `storybook build` writes. Those are published with the site at `https://brenertiv.github.io/project-kilowatt-ui/manifests/`. A new deploy of the site reaches the server within 5 minutes; the server needs no redeploy.

A static host can't answer MCP, so this small server sits beside GitHub Pages. The dev and test toolsets (story previews, `test-run`) only exist on a local `npm run storybook`.

## Run it

```bash
cd mcp
npm ci
npm start
```

It listens on `http://localhost:8787/mcp`. Environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `STORYBOOK_URL` | `https://brenertiv.github.io/project-kilowatt-ui/` | The published Storybook to read manifests from. |
| `STORYBOOK_DIR` | unset | A local build to read instead, e.g. `../storybook-static`. Takes precedence over the URL. |
| `MCP_TOKEN` | unset | When set, requests need `Authorization: Bearer <token>`. Leave it unset while the Storybook is public. |
| `PORT` | `8787` | |

It needs Node 24, which runs the TypeScript directly. There is no build step.

## Deploy it

Any host that runs a Node 24 process can run `npm ci && npm start` from this folder with a public HTTPS URL: Fly.io, Render, Railway, a VM or a container platform.

- `handler.ts` is Fetch API in and out, so a serverless or edge runtime can call it from its own entry point instead of `server.ts`. The exception is reading from `STORYBOOK_DIR`, which needs `node:fs`.
- `/` and `/health` answer with plain text for health checks.

## Connect an agent

Claude Code, in the consuming project's `.mcp.json`:

```json
{
  "mcpServers": {
    "kilowatt": { "type": "http", "url": "https://<your-host>/mcp" }
  }
}
```

With a token, add `"headers": { "Authorization": "Bearer ${KILOWATT_MCP_TOKEN}" }`. Cursor and VS Code take the same URL in their own MCP settings.

## Test it against a local build

```bash
npm run build-storybook                          # in the repository root
cd mcp && STORYBOOK_DIR=../storybook-static npm start
curl -s -X POST localhost:8787/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"docs-list","arguments":{}}}'
```
