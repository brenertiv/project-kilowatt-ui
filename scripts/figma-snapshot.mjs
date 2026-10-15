#!/usr/bin/env node
/**
 * Assembles chunk files returned by `figma/snapshot.figma.js` into
 * `src/figma/variables.json`, the committed snapshot of the Figma variables.
 *
 *   node scripts/figma-snapshot.mjs chunk1.json chunk2.json ...
 *
 * Collections and variables are sorted by name so the file diffs one line
 * per change. The file key comes from `src/figma/links.json`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const target = resolve(root, 'src/figma/variables.json');
const links = JSON.parse(readFileSync(resolve(root, 'src/figma/links.json'), 'utf8'));
const fileKey = links.file ? new URL(links.file).pathname.split('/')[2] : null;

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('usage: figma-snapshot <chunk.json ...>');
  process.exit(2);
}

const collections = {};
for (const input of inputs) {
  const parsed = JSON.parse(readFileSync(resolve(input), 'utf8'));
  for (const chunk of Array.isArray(parsed) ? parsed : [parsed]) {
    if (!chunk || !chunk.name || !Array.isArray(chunk.modes) || !Array.isArray(chunk.vars)) {
      throw new Error(`${input}: not a snapshot chunk`);
    }
    const variables = {};
    for (const [name, type, description, ...values] of chunk.vars) {
      if (values.length !== chunk.modes.length)
        throw new Error(`${chunk.name}/${name}: ${values.length} values for ${chunk.modes.length} modes`);
      const entry = { type, values: Object.fromEntries(chunk.modes.map((mode, index) => [mode, values[index]])) };
      if (description) entry.description = description;
      variables[name] = entry;
    }
    const sorted = Object.fromEntries(Object.entries(variables).sort(([a], [b]) => a.localeCompare(b)));
    collections[chunk.name] = { modes: chunk.modes, variables: sorted };
  }
}

const previous = (() => {
  try {
    return JSON.parse(readFileSync(target, 'utf8'));
  } catch {
    return null;
  }
})();
// Keep collections from the previous snapshot that this run did not re-dump.
const merged = { ...(previous?.collections ?? {}), ...collections };
const snapshot = {
  fileKey,
  fetchedAt: new Date().toISOString(),
  collections: Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b))),
};
writeFileSync(target, `${JSON.stringify(snapshot, null, 2)}\n`);
const counts = Object.entries(snapshot.collections).map(
  ([name, c]) => `${name}: ${Object.keys(c.variables).length} variables, modes ${c.modes.join('/')}`,
);
console.log(`wrote ${target}\n${counts.join('\n')}`);
