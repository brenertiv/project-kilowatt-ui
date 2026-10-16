// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { departures } from '../mui/departures';

/**
 * Every component page follows one format (docs/stories.md, "Component pages"), so agents
 * reading the manifest find the same sections in the same place for every component.
 */

const dir = fileURLToPath(new URL('.', import.meta.url));
const root = fileURLToPath(new URL('../..', import.meta.url));

/** The sections a component page may have, in order. */
const template = ['When to use', 'Usage', 'Variants', 'States', "Do and don't", 'MUI departures', 'Accessibility', 'Related'];
/** The sections every component page must have. */
const required = ['When to use', 'Usage', "Do and don't", 'MUI departures', 'Accessibility'];

const muiMajor = JSON.parse(readFileSync(join(root, 'node_modules/@mui/material/package.json'), 'utf8')).version.split('.')[0];

const pages = readdirSync(dir)
  .filter((file) => file.endsWith('.stories.tsx'))
  .map((file) => {
    const stories = readFileSync(join(dir, file), 'utf8');
    const mdxFile = file.replace(/\.stories\.tsx$/, '.mdx');
    const mdx = readdirSync(dir).includes(mdxFile) ? readFileSync(join(dir, mdxFile), 'utf8') : '';
    const listed = /muiComponents:\s*\[([^\]]*)\]/.exec(stories)?.[1] ?? '';
    const components = [...listed.matchAll(/'([^']+)'/g)].map((match) => match[1]);
    return { file, mdxFile, mdx, components };
  });

/** The body of one `## heading` section. */
function section(mdx: string, heading: string) {
  return mdx.split(/^## /m).find((chunk) => chunk.startsWith(`${heading}\n`)) ?? '';
}

describe.each(pages)('$file', ({ mdxFile, mdx, components }) => {
  it('has a guidance page beside it and names the MUI components it documents', () => {
    expect(mdx, `${mdxFile} is missing`).not.toBe('');
    expect(components, 'parameters.muiComponents in the stories meta').not.toEqual([]);
  });

  it('uses the template sections, in order', () => {
    const headings = [...mdx.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
    for (const heading of headings) expect(template, `unknown section "${heading}"`).toContain(heading);
    expect(headings).toEqual([...headings].sort((a, b) => template.indexOf(a) - template.indexOf(b)));
    for (const heading of required) expect(headings, `missing "## ${heading}"`).toContain(heading);
  });

  it('names the Material UI major it is written for', () => {
    expect(mdx.split(/^## /m)[0]).toContain(`Material UI v${muiMajor}`);
  });

  it("pairs a Do with a Don't", () => {
    const body = section(mdx, "Do and don't");
    expect(body).toMatch(/^- Do /m);
    expect(body).toMatch(/^- Don't /m);
  });

  it('lists exactly the departures that apply to its components', () => {
    const expected = departures.filter((departure) => departure.components?.some((name) => components.includes(name))).map(({ id }) => id);
    const listed = [...section(mdx, 'MUI departures').matchAll(/^- `([^`]+)`/gm)].map((match) => match[1]);
    expect(listed.sort()).toEqual(expected.sort());
  });
});
