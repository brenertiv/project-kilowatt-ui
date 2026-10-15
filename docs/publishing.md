# Publishing

The design system is published as one Vercel project, behind Vercel Deployment Protection, so only people with access to the team can open it. It has three parts:

- **The Storybook:** components, foundations and guides.
- **The static files agents read:** `llms.txt`, the per-page Markdown, `/manifests/*.json` and the token files.
- **The MCP endpoint at `/mcp`.**

## How it builds

`vercel.json` holds the project settings:

- **Build:** `npm run build-storybook`. This generates the docs, builds Storybook, writes `llms.txt` and runs the docs coverage check. A component missing its docs fails the deploy.
- **Output:** `storybook-static/`, served as static files.
- **`/mcp`:** rewritten to the function `api/mcp.ts`.
  - The function runs the docs tools of `@storybook/mcp`: `docs-list`, `docs-show` and `docs-show-story`.
  - It reads the manifests from the same build. `includeFiles` bundles them into the function, so it never fetches through the deployment's own protection.
  - Every deployment, previews included, serves a Storybook and an MCP endpoint that match each other.

Connect the repository through Vercel's Git integration. Pushes to `main` deploy to production, and pull requests get preview deployments.

## Access

- **People** sign in through the project's Deployment Protection, which is set up already. Make sure it covers the production domain as well as previews: Vercel's standard protection leaves production domains open.
- **Agents** can't complete a browser login. They send the project's **Protection Bypass for Automation** secret instead:
  - Header: `x-vercel-protection-bypass: <secret>`.
  - Where: project **Settings → Deployment Protection → Protection Bypass for Automation**.
  - Treat it like a password. Anyone holding it can read the whole deployment.
  - Rotate it by generating a new one and updating the variable below.

## Connecting an agent

Each developer sets two environment variables, for example in their shell profile:

```bash
export KILOWATT_STORYBOOK_URL="https://<project>.vercel.app"
export KILOWATT_MCP_BYPASS="<the bypass secret>"
```

**Claude Code.** Add this to the consuming project's `.mcp.json`. Claude Code expands `${…}` from the environment.

```json
{
  "mcpServers": {
    "kilowatt": {
      "type": "http",
      "url": "${KILOWATT_STORYBOOK_URL}/mcp",
      "headers": { "x-vercel-protection-bypass": "${KILOWATT_MCP_BYPASS}" }
    }
  }
}
```

**Cursor and VS Code** take the same URL and header in their MCP settings.

**Agents that only fetch URLs** need the same header on every request, for example for `${KILOWATT_STORYBOOK_URL}/llms.txt`.

## Checking a deployment

```bash
curl -s -X POST "$KILOWATT_STORYBOOK_URL/mcp" \
  -H "x-vercel-protection-bypass: $KILOWATT_MCP_BYPASS" \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"docs-list","arguments":{}}}'
```

- **No header:** a 401 or a login redirect means protection is working.
- **With the header:** an `event: message` reply listing the components means the function works.

Before any deploy, `npx vercel build` runs the same build locally and writes `.vercel/output/`.

## The old GitHub Pages site

The repository used to publish the app to GitHub Pages at `brenertiv.github.io/project-kilowatt-ui`, and that site is public. The workflow is gone, but GitHub keeps serving the last deployment. Unpublish it under the repository's **Settings → Pages**.
