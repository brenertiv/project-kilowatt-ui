# Publishing

The design system is published as one public Vercel project. Anyone with the URL can open it, and there is no login. It has three parts:

- **The Storybook:** components, foundations and guides.
- **The static files agents read:** `llms.txt`, the per-page Markdown, `/manifests/*.json` and the token files.
- **The MCP endpoint at `/mcp`.**

Nothing here is sensitive: it's component docs and design tokens, with sample data generated from a fixed seed. If that changes, add access control before publishing anything that needs it.

## How it builds

`vercel.json` holds the project settings:

- **Build:** `npm run build-storybook`. This generates the docs, builds Storybook, writes `llms.txt` and runs the docs coverage check. A component missing its docs fails the deploy.
- **Output:** `storybook-static/`, served as static files.
- **`/mcp`:** rewritten to the function `api/mcp.ts`.
  - The function runs the docs tools of `@storybook/mcp`: `docs-list`, `docs-show` and `docs-show-story`.
  - It reads the manifests from the same build, which `includeFiles` bundles into the function.
  - Every deployment, previews included, serves a Storybook and an MCP endpoint that match each other.

## Setting up the Vercel project

1. Import `brenertiv/project-kilowatt-ui` in Vercel. Leave the root directory as the repository root; `vercel.json` sets everything else.
2. Under **Settings → Deployment Protection**, turn protection off, or check that it leaves the production domain open. Vercel's default protects preview deployments, which is fine; the production URL is the one people and agents use.
3. Deploy. Pushes to `main` deploy to production, and pull requests get preview deployments.

## Connecting an agent

**Claude Code.** Add this to the consuming project's `.mcp.json`, with the production URL:

```json
{
  "mcpServers": {
    "kilowatt": { "type": "http", "url": "https://kilowatt-ui.vercel.app/mcp" }
  }
}
```

**Claude, Cursor and VS Code** take the same URL as a remote MCP server. In Claude, add it as a custom connector.

**Agents that only fetch URLs** start at `https://kilowatt-ui.vercel.app/llms.txt`.

## Checking a deployment

```bash
curl -s -X POST "https://kilowatt-ui.vercel.app/mcp" \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"docs-list","arguments":{}}}'
```

An `event: message` reply listing the components means the function works. Before any deploy, `npx vercel build` runs the same build locally and writes `.vercel/output/`.

## The old GitHub Pages site

The repository used to publish the app to GitHub Pages at `brenertiv.github.io/project-kilowatt-ui`. The workflow is gone, but GitHub keeps serving the last deployment, which is the old app. Unpublish it under the repository's **Settings → Pages** so there's one site.
