/**
 * The mechanical half of the agent eval rubric in docs/agent-evals.md. Reads
 * the files an agent wrote and reports, per file, what a person should look
 * at. Heuristics, not proof: a clean report earns the points only after a
 * person has read the code.
 *
 *   npx tsx scripts/grade-eval.ts src/evals
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

type Finding = { check: string; ok: boolean; detail: string };

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

function matches(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].map((match) => `line ${lineOf(text, match.index ?? 0)}: ${match[0].trim().slice(0, 60)}`);
}

export function grade(source: string): Finding[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const systemImports = matches(code, /from '(src\/|(\.\.?\/)+)(components|charts)[^']*'/g);
  const colors = matches(code, /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/g);
  const fonts = matches(code, /font-?family/gi);
  const pixels = matches(code, /['"`:\s]-?\d+(\.\d+)?px\b/g);
  const queries = /\buse(EntityList|Entity|EnergyData|Lookup)\(/.test(code);
  const states = /\bfromQuery\(/.test(code) && /\b(DataState|state=)/.test(code);
  const spinners = matches(code, /\b(CircularProgress|LinearProgress)\b|className="[^"]*spinner/g);
  const usesI18n = /\buseTranslation\(|\bt\(['`]/.test(code);
  const literalCopy = matches(code, />\s*[A-Z][a-z]+(\s+[a-z]+){1,}\s*</g);

  return [
    { check: 'Imports documented components', ok: systemImports.length > 0, detail: systemImports.join('; ') || 'no imports from src/components or src/charts' },
    { check: 'No hard-coded colors', ok: colors.length === 0, detail: colors.join('; ') },
    { check: 'No hard-coded font families', ok: fonts.length === 0, detail: fonts.join('; ') },
    { check: 'No pixel sizes', ok: pixels.length === 0, detail: pixels.join('; ') },
    {
      check: 'Async states through fromQuery and DataState or state',
      ok: !queries || states,
      detail: queries ? (states ? '' : 'queries without fromQuery plus DataState or a state prop') : 'no queries',
    },
    { check: 'No hand-rolled spinner', ok: spinners.length === 0, detail: spinners.join('; ') },
    { check: 'Copy through i18n', ok: usesI18n || literalCopy.length === 0, detail: usesI18n ? '' : literalCopy.join('; ') },
  ];
}

function files(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => files(join(path, name)));
}

const target = resolve(process.argv[2] ?? 'src/evals');
for (const file of files(target).filter((path) => /\.tsx?$/.test(path))) {
  const findings = grade(readFileSync(file, 'utf8'));
  const passed = findings.filter((finding) => finding.ok).length;
  console.log(`\n${relative(process.cwd(), file)}: ${passed}/${findings.length} checks pass`);
  for (const finding of findings) {
    console.log(`  ${finding.ok ? 'ok  ' : 'FAIL'} ${finding.check}${finding.detail && !finding.ok ? ` (${finding.detail})` : ''}`);
  }
}
