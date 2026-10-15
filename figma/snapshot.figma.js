// Dumps one or more variable collections in the repository's snapshot chunk
// format. Run it in the file through the Figma connector (use_figma) or paste it
// into a development plugin. The plugin sandbox has no network and a 20 KB
// return limit, so run it once per collection (set COLLECTIONS) and feed the
// returned JSON chunks to `npm run figma:snapshot -- <chunk files>`.
//
// Chunk format: { name, modes: [..], vars: [[name, type, description|null, ...valuePerMode]] }
// A value is a hex string, a number, a string, { alias } or { alias, opacity }.
const COLLECTIONS = ['primitives'];

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const byId = new Map(variables.map((v) => [v.id, v]));
const collById = new Map(collections.map((c) => [c.id, c]));
const h = (n) =>
  Math.round(n * 255)
    .toString(16)
    .padStart(2, '0');
const hex = (c) => `#${h(c.r)}${h(c.g)}${h(c.b)}` + (c.a !== undefined && c.a < 1 ? h(c.a) : '');
const ref = (id) => {
  const t = byId.get(id);
  return t ? `${collById.get(t.variableCollectionId)?.name}/${t.name}` : `?${id}`;
};
const encode = (value) => {
  if (value && typeof value === 'object') {
    if (value.type === 'VARIABLE_ALIAS') return { alias: ref(value.id) };
    if (value.color && value.color.type === 'VARIABLE_ALIAS')
      return { alias: ref(value.color.id), opacity: value.opacity };
    if ('r' in value) return hex(value);
  }
  return value;
};
return collections
  .filter((c) => COLLECTIONS.includes(c.name))
  .map((c) => ({
    name: c.name,
    modes: c.modes.map((m) => m.name),
    vars: c.variableIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((v) => [
        v.name,
        v.resolvedType,
        v.description || null,
        ...c.modes.map((m) => encode(v.valuesByMode[m.modeId])),
      ]),
  }));
