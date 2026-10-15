/**
 * Turns a built Storybook's manifests into plain Markdown for agents that can
 * fetch URLs but cannot speak MCP (https://llmstxt.org):
 *
 * - `llms.txt`: an index of every guide, foundations page and component, one
 *   line each, linking to the pages below.
 * - `components/<id>.md`: the import line, description, props, guidance and
 *   every story's snippet.
 * - `guides/<slug>.md`, `foundations/<slug>.md` and `introduction.md`: the
 *   docs pages, with their MDX stripped back to Markdown.
 *
 * Runs after `storybook build` (see `npm run build-storybook`):
 *
 *   npx tsx scripts/build-llms.ts [storybook-static]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Prop = {
  required?: boolean;
  tsType?: { name: string; raw?: string };
  type?: { name: string; raw?: string };
  defaultValue?: { value: string } | null;
  description?: string;
};
type DocEntry = { id: string; title: string; path: string; content?: string; summary?: string };
type Component = {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  import?: string;
  reactDocgen?: { props?: Record<string, Prop> };
  stories?: { id: string; name: string; snippet?: string; description?: string }[];
  docs?: Record<string, DocEntry>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.argv[2] ?? 'storybook-static');
const read = <T>(file: string): T => JSON.parse(readFileSync(join(out, file), 'utf8')) as T;

/** Section order, matching the Storybook sidebar. */
const sections = ['Primitives', 'Data', 'Table', 'Charts', 'Menus', 'Patterns', 'Pages'];

/**
 * The import block from the manifest, cut down to what a consumer writes.
 * Storybook names our package (`project-kilowatt-ui`) for elements a story
 * passes in args; icons really come from `src/icons`, anything else is story
 * scaffolding. Sample data and test helpers are story-only, so they go too.
 */
export function cleanImports(block: string) {
  const lines = new Set<string>();
  for (const line of block.split('\n').map((text) => text.trim()).filter(Boolean)) {
    const from = /from '([^']+)'/.exec(line)?.[1];
    if (!from) continue;
    if (from === 'project-kilowatt-ui') {
      const names = /\{([^}]*)\}/.exec(line)?.[1].split(',').map((name) => name.trim()).filter((name) => name.endsWith('Icon'));
      if (names?.length) lines.add(`import { ${names.join(', ')} } from 'src/icons';`);
      continue;
    }
    if (from === 'storybook/test' || /^src\/(fixtures|stories|data|meters)\b/.test(from)) continue;
    lines.add(line);
  }
  // Merge duplicate named imports from one module (the cleanup above can produce two src/icons lines).
  const merged = new Map<string, Set<string>>();
  const other: string[] = [];
  for (const line of lines) {
    const match = /^import \{([^}]*)\} from '([^']+)';?$/.exec(line);
    if (!match) {
      other.push(line);
      continue;
    }
    const names = merged.get(match[2]) ?? new Set<string>();
    for (const name of match[1].split(',').map((part) => part.trim()).filter(Boolean)) names.add(name);
    merged.set(match[2], names);
  }
  return [...other, ...[...merged].map(([from, names]) => `import { ${[...names].sort().join(', ')} } from '${from}';`)].join('\n');
}

/**
 * MDX source back to Markdown: no imports, Meta, comments or blocks; escapes
 * undone. Storybook links (`?path=/docs/<id>--docs`) become links to the
 * component's page, relative to `base` (the folder the page is written to).
 */
export function mdxToMarkdown(mdx: string, base = '') {
  const toComponents = base === 'components' ? '' : base ? '../components/' : 'components/';
  return mdx
    .replace(/\]\(\?path=\/docs\/([a-z0-9-]+)--docs\)/g, (_, id: string) => `](${toComponents}${id}.md)`)
    .replace(/^import .*$/gm, '')
    .replace(/<Meta[\s\S]*?\/>/g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^<(Canvas|ArgTypes|Stories|Description|Primary|Controls|Source)\b[\s\S]*?\/>\s*$/gm, '')
    .replace(/\\([{}])/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function componentPage(component: Component, title: string) {
  const parts = [`# ${component.name}`, `\`${title}\``];
  if (component.summary) parts.push(`> ${component.summary}`);
  const imports = component.import ? cleanImports(component.import) : '';
  if (imports) parts.push('## Import', `\`\`\`tsx\n${imports}\n\`\`\``);
  if (component.description) parts.push(component.description);

  const guidance = Object.values(component.docs ?? {}).find((doc) => doc.content);
  if (guidance?.content) {
    // The guidance page repeats the component name as its heading; drop it.
    parts.push(mdxToMarkdown(guidance.content, 'components').replace(/^# .*\n+/, '').replace(/^## /gm, '### ').replace(/^/, '## Guidance\n\n'));
  }

  const props = Object.entries(component.reactDocgen?.props ?? {});
  if (props.length) {
    const rows = props.map(([name, prop]) => {
      const type = prop.tsType?.raw ?? prop.tsType?.name ?? prop.type?.raw ?? prop.type?.name ?? '';
      return `| \`${name}\`${prop.required ? ' (required)' : ''} | \`${cell(type)}\` | ${prop.defaultValue ? `\`${cell(prop.defaultValue.value)}\`` : ''} | ${cell(prop.description ?? '')} |`;
    });
    parts.push('## Props', '| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n' + rows.join('\n'));
  }

  const stories = (component.stories ?? []).filter((story) => story.snippet);
  if (stories.length) {
    parts.push('## Examples');
    for (const story of stories) {
      parts.push(`### ${story.name}`);
      if (story.description) parts.push(story.description);
      parts.push(`\`\`\`tsx\n${story.snippet}\n\`\`\``);
    }
  }
  return `${parts.join('\n\n')}\n`;
}

function write(path: string, text: string) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), text);
}

function main() {
  const { components } = read<{ components: Record<string, Component> }>('manifests/components.json');
  const { docs } = read<{ docs: Record<string, DocEntry> }>('manifests/docs.json');
  const index = read<{ entries: Record<string, { title: string; type: string }> }>('index.json');
  const titleOf = (id: string) => Object.values(index.entries).find((entry) => entry.title && id.startsWith(slug(entry.title)))?.title ?? id;

  const pageLinks = new Map<string, string[]>();
  const link = (group: string, line: string) => pageLinks.set(group, [...(pageLinks.get(group) ?? []), line]);

  for (const doc of Object.values(docs)) {
    if (!doc.content) continue;
    const [group, ...rest] = doc.title.split('/');
    const file = rest.length ? `${group.toLowerCase()}/${slug(rest.join('-'))}.md` : `${slug(group)}.md`;
    write(file, `${mdxToMarkdown(doc.content, rest.length ? group.toLowerCase() : '')}\n`);
    link(rest.length ? group : 'Start here', `- [${rest.join('/') || group}](${file})${doc.summary ? `: ${doc.summary}` : ''}`);
  }

  for (const component of Object.values(components)) {
    const title = titleOf(component.id);
    const group = title.split('/')[0];
    if (!sections.includes(group)) continue;
    const file = `components/${component.id}.md`;
    write(file, componentPage(component, title));
    const summary = component.summary ?? Object.values(component.docs ?? {}).find((doc) => doc.summary)?.summary;
    link(group, `- [${component.name}](${file})${summary ? `: ${summary}` : ''}`);
  }

  const order = ['Start here', 'Guides', 'Foundations', ...sections];
  const llms = [
    '# Kilowatt UI',
    "> Enertiv's design system: tokens mirrored from Figma, Base UI primitives with plain CSS, Material UI components themed from the tokens, data components on the Enertiv API's shapes, amCharts charts and page views. Import documented components rather than rebuilding them, use tokens only, and cover every async state.",
    'Each component page has its import line, props, guidance and example snippets. Read Guides/Rules first. Agents that speak MCP can query the same content from the Storybook MCP server (`/mcp` on a running Storybook dev server).',
    ...order.filter((group) => pageLinks.has(group)).map((group) => `## ${group}\n\n${pageLinks.get(group)!.sort().join('\n')}`),
    [
      '## Optional',
      '',
      '- [Design tokens, light (DTCG)](tokens.light.json): every primitive and semantic color for the light scheme, in DTCG 2025.10 format.',
      '- [Design tokens, dark (DTCG)](tokens.dark.json): the same for the dark scheme.',
      '- [Token CSS](kilowatt-tokens.css): the CSS custom properties, `:root` and `html.dark`.',
      '- [Components manifest](manifests/components.json): the raw Storybook manifest these pages are built from.',
    ].join('\n'),
  ].join('\n\n');
  write('llms.txt', `${llms}\n`);

  const count = [...pageLinks.values()].reduce((sum, lines) => sum + lines.length, 0);
  console.log(`build-llms: llms.txt with ${count} pages in ${out}`);
}

main();
