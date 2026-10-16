/**
 * Fails when the design system's docs fall behind its code. Run after
 * `storybook build`, against the manifest agents read:
 *
 * - every exported component in src/components, src/charts and src/pages is
 *   used by a story file;
 * - every manifest entry has a one-line summary, from its JSDoc `@summary`
 *   or, for recipes and patterns with no component, from its guidance page;
 * - every entry with a component has a description and an import line, and
 *   describes at least 90% of its props;
 * - no entry with a component fails to resolve it.
 *
 *   npx tsx scripts/check-docs.ts [storybook-static]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Component = {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  import?: string;
  error?: { name: string; message: string };
  reactDocgen?: { props?: Record<string, { description?: string }> };
  docs?: Record<string, { summary?: string }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.argv[2] ?? 'storybook-static');
const propCoverage = 0.9;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const problems: string[] = [];

// Every exported component is used by a story file.
const sources = ['src/components', 'src/charts', 'src/pages']
  .map((dir) => join(root, dir))
  .filter((dir) => existsSync(dir))
  .flatMap((dir) => files(dir));
const storyText = sources
  .filter((file) => file.endsWith('.stories.tsx'))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
for (const file of sources.filter((path) => path.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(path))) {
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/^export function ([A-Z]\w*)/gm)) {
    if (!new RegExp(`\\b${name}\\b`).test(storyText)) {
      problems.push(`${relative(root, file)}: ${name} is exported but no story uses it`);
    }
  }
}

// Every manifest entry is documented well enough for an agent to use it.
const { components } = JSON.parse(readFileSync(join(out, 'manifests/components.json'), 'utf8')) as {
  components: Record<string, Component>;
};
for (const component of Object.values(components)) {
  const guidance = Object.values(component.docs ?? {});
  const where = `${component.id} (${component.name})`;
  if (!component.summary && !guidance.some((doc) => doc.summary)) problems.push(`${where}: no @summary and no guidance page summary`);

  if (component.error) {
    // Recipes and patterns have no component of ours; their guidance page carries the docs.
    if (!guidance.length) problems.push(`${where}: ${component.error.name}: ${component.error.message.split('\n')[0]}`);
    continue;
  }
  if (!component.description) problems.push(`${where}: no description`);
  if (!component.import) problems.push(`${where}: no import line (add an @import tag)`);
  const props = Object.entries(component.reactDocgen?.props ?? {});
  const undocumented = props.filter(([, prop]) => !prop.description?.trim()).map(([name]) => name);
  if (props.length && (props.length - undocumented.length) / props.length < propCoverage) {
    problems.push(`${where}: ${undocumented.length} of ${props.length} props undocumented (${undocumented.join(', ')})`);
  }
}

if (problems.length) {
  console.error(`check-docs: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n${problems.map((line) => `  - ${line}`).join('\n')}`);
  process.exit(1);
}
console.log(`check-docs: ${Object.keys(components).length} components documented, every exported component has a story`);
