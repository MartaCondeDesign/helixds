/**
 * A DTCG 2025.10 resolver (https://www.designtokens.org/tr/2025.10/resolver/) — just what Helix needs from it:
 * read a .resolver.json, take an input ({ theme: 'dark' }), and return the one token tree it resolves to.
 *
 *   - sets and modifier contexts are lists of sources: a { "$ref" } to a token file (relative to the resolver),
 *     a { "$ref": "#/sets/<name>" } to a set, or inline tokens
 *   - resolutionOrder is walked in order; a later token replaces an earlier one at the same path (groups merge)
 *   - inputs are validated against the modifiers' contexts; a modifier without an input uses its default
 *   - aliases are NOT resolved here (the spec resolves them only after merging) — the build does that, so a
 *     component color aliasing a semantic color takes the semantic color's dark value by itself
 *
 * Plain JavaScript (types in resolver.d.mts), like dtcg.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';

const isToken = node => node && typeof node === 'object' && '$value' in node;

/** Merge `source` into `target` in place: groups merge key by key, a token replaces whatever was there. */
function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (isToken(value) || !value || typeof value !== 'object' || Array.isArray(value)) target[key] = structuredClone(value);
    else if (key.startsWith('$')) target[key] = structuredClone(value); // a group's own $description/$extensions
    else {
      if (!target[key] || typeof target[key] !== 'object' || isToken(target[key])) target[key] = {};
      merge(target[key], value);
    }
  }
  return target;
}

export function loadResolver(resolverPath) {
  const file = path.resolve(resolverPath);
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (doc.version !== '2025.10') throw new Error(`${resolverPath}: version must be "2025.10" (got ${JSON.stringify(doc.version)})`);
  if (!Array.isArray(doc.resolutionOrder)) throw new Error(`${resolverPath}: resolutionOrder is required`);
  for (const [name, modifier] of Object.entries(doc.modifiers ?? {})) {
    const contexts = Object.keys(modifier.contexts ?? {});
    if (!contexts.length) throw new Error(`modifier "${name}" has no contexts`);
    if (modifier.default !== undefined && !contexts.includes(modifier.default)) throw new Error(`modifier "${name}": default "${modifier.default}" is not one of its contexts`);
  }

  const files = new Map();
  const readTokens = ref => {
    const target = path.resolve(path.dirname(file), ref);
    if (!files.has(target)) files.set(target, JSON.parse(fs.readFileSync(target, 'utf8')));
    return files.get(target);
  };
  const pointer = ref => ref.slice(2).split('/').reduce((node, key) => node?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], doc);

  const sourceTokens = (source, seen = new Set()) => {
    if (!source || typeof source !== 'object' || !('$ref' in source)) return [source]; // inline tokens
    const ref = source.$ref;
    if (!ref.startsWith('#')) return [readTokens(ref)];
    if (seen.has(ref)) throw new Error(`circular reference ${ref}`);
    if (!ref.startsWith('#/sets/')) throw new Error(`${ref}: a source may point at a token file or a set, not a modifier or the resolution order`);
    const set = pointer(ref);
    if (!set) throw new Error(`invalid pointer ${ref}`);
    return set.sources.flatMap(s => sourceTokens(s, new Set([...seen, ref])));
  };

  /** The token tree for these inputs, aliases unresolved. */
  function resolve(inputs = {}) {
    const modifiers = doc.modifiers ?? {};
    for (const [key, value] of Object.entries(inputs)) {
      if (!modifiers[key]) throw new Error(`input "${key}" is not a modifier of ${path.basename(file)}`);
      if (!(value in modifiers[key].contexts)) throw new Error(`"${value}" is not a context of modifier "${key}" (${Object.keys(modifiers[key].contexts).join(', ')})`);
    }
    const tree = {};
    for (const item of doc.resolutionOrder) {
      const ref = item.$ref;
      const resolved = ref ? pointer(ref) : item;
      if (!resolved) throw new Error(`invalid pointer ${ref}`);
      const isModifier = ref ? ref.startsWith('#/modifiers/') : item.type === 'modifier';
      if (isModifier) {
        const name = ref ? ref.split('/').pop() : item.name;
        const context = inputs[name] ?? resolved.default;
        if (context === undefined) throw new Error(`modifier "${name}" needs an input (it has no default)`);
        for (const source of resolved.contexts[context]) for (const tokens of sourceTokens(source)) merge(tree, tokens);
      } else {
        for (const source of resolved.sources) for (const tokens of sourceTokens(source)) merge(tree, tokens);
      }
    }
    return tree;
  }

  return { document: doc, resolve, modifiers: Object.fromEntries(Object.entries(doc.modifiers ?? {}).map(([k, m]) => [k, Object.keys(m.contexts)])) };
}
