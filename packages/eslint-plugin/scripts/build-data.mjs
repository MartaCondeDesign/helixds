#!/usr/bin/env node
/**
 * Generates src/data.json — everything the rules know about Helix — from the repo's own sources, so the
 * plugin never carries a hand-copied list that can drift:
 *
 *   antiSynonyms   .ai/maps/prop-map.md           wrong prop name → canonical prop
 *   valueSynonyms  .ai/maps/prop-map.md           wrong variant/size value → canonical value
 *   props          contracts/components/*.json    every Helix component's documented props
 *   colors         packages/tokens/src/tokens.json  light-mode hex → semantic color CSS variables
 *   primitives     packages/tokens/src/tokens.json  "blue-600" → hex, to map Tailwind palette classes
 *   spacing        packages/tokens/src/tokens.json  "16px" → semantic spacing CSS variables with that value
 *   coreExports    packages/core/src/index.ts      every name @helixds/react really exports (values + types)
 *   passthrough    packages/core/src/(components|layout)/<Name>/<Name>.types.ts  props that extend HTML attributes
 *   packages       packages/<dir>/package.json     the real @helixds/* package names
 *
 * Run: pnpm --filter @helixds/eslint-plugin build:data  (the test suite fails if data.json is stale)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAlias, toCss } from '../../tokens/src/dtcg.mjs';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(pkg, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// ── prop-map.md ─────────────────────────────────────────────────────────────
// Prop-name tables vs value tables: "Naming variants" lists variant VALUES, "Anatomy size values" size
// values. Everything else is a prop name.
const PROP_SECTIONS = ['Core variants + sizes', 'Boolean states', 'Event handlers', 'Content + layout', 'Width + alignment'];
const VALUE_SECTIONS = { 'Naming variants': 'variant', 'Anatomy size values': 'size' };

function sections(md) {
  const out = {};
  let current = null;
  for (const line of md.split('\n')) {
    const heading = line.match(/^## (.+)$/);
    if (heading) { current = heading[1].trim(); out[current] = []; continue; }
    if (!current || !line.startsWith('|') || /^\|\s*[-:]/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(cell => [...cell.matchAll(/`([^`]+)`/g)].map(m => m[1]));
    if (cells[0]?.length === 1 && cells[1]?.length) out[current].push({ canonical: cells[0][0], wrong: cells[1] });
  }
  return out;
}

const propMap = sections(read('.ai/maps/prop-map.md'));
const antiSynonyms = {};
for (const name of PROP_SECTIONS) {
  for (const row of propMap[name] ?? []) for (const wrong of row.wrong) antiSynonyms[wrong] ??= row.canonical;
}
const valueSynonyms = {};
for (const [name, prop] of Object.entries(VALUE_SECTIONS)) {
  valueSynonyms[prop] = {};
  for (const row of propMap[name] ?? []) {
    for (const wrong of row.wrong) if (wrong !== row.canonical) valueSynonyms[prop][wrong] ??= row.canonical;
  }
}

// ── contracts ───────────────────────────────────────────────────────────────
const props = {};
for (const file of fs.readdirSync(path.join(root, 'contracts/components')).filter(f => f.endsWith('.json')).sort()) {
  const contract = JSON.parse(read(`contracts/components/${file}`));
  if (contract.name && Array.isArray(contract.props)) props[contract.name] = contract.props.map(p => p.name);
}

// ── tokens ──────────────────────────────────────────────────────────────────
const tokens = JSON.parse(read('packages/tokens/src/tokens.json'));
const get = dotted => dotted.split('.').reduce((node, key) => node?.[key], tokens);
// Follows aliases to the final token, then renders its DTCG 2025.10 value as CSS ("#2563eb", "16px").
const resolve = value => {
  let token = { $value: value };
  for (let hops = 0; isAlias(token?.$value) && hops < 10; hops++) token = get(token.$value.slice(1, -1));
  return token && !isAlias(token.$value) ? toCss(token.$value, token.$type, { extensions: token.$extensions }).toLowerCase() : undefined;
};

const primitives = {};
for (const [hue, steps] of Object.entries(tokens.primitive.color)) {
  for (const [step, token] of Object.entries(steps)) primitives[`${hue}-${step}`] = toCss(token.$value, token.$type).toLowerCase();
}

const colors = {};
for (const [surface, group] of Object.entries(tokens.semantic.color)) {
  for (const [key, token] of Object.entries(group)) {
    const hex = resolve(token.$value);
    if (!hex?.startsWith('#')) continue;
    (colors[hex] ??= []).push(`--helix-color-${surface}-${key}`);
  }
}

// T-shirt keys (xs, m, …) first: they are the canonical scale; component-*/layout-* are the older
// context scale, suggested only after them (or alone, for 48/64px, which have no t-shirt key).
const spacing = {};
const spacingKeys = Object.keys(tokens.semantic.spacing);
const contextKey = key => /^(component|layout)-/.test(key);
for (const key of [...spacingKeys.filter(k => !contextKey(k)), ...spacingKeys.filter(contextKey)]) {
  const px = resolve(tokens.semantic.spacing[key].$value);
  if (px?.endsWith('px')) (spacing[px] ??= []).push(`--helix-spacing-${key}`);
}

// ── @helixds/react exports ──────────────────────────────────────────────────
const coreExports = new Set();
for (const m of read('packages/core/src/index.ts').matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
  for (const spec of m[1].split(',')) {
    const name = spec.trim().split(/\s+as\s+/).pop()?.trim();
    if (name) coreExports.add(name);
  }
}

// ── which components take native HTML attributes ──────────────────────────
// Only those whose props type extends React's HTML attributes accept title, style, id, onClick… on top of
// their own props. Code lines only: a comment saying a component *used to* extend them doesn't count.
const passthrough = [];
for (const base of ['packages/core/src/components', 'packages/core/src/layout']) {
  for (const name of fs.readdirSync(path.join(root, base))) {
    const file = path.join(root, base, name, `${name}.types.ts`);
    if (!fs.existsSync(file)) continue;
    const code = fs.readFileSync(file, 'utf8').split('\n').filter(line => !/^\s*(\*|\/\/|\/\*)/.test(line)).join('\n');
    if (/(extends|&)[^{;]*\b\w*HTMLAttributes\b|(extends|&)[^{;]*ComponentProps(WithoutRef|WithRef)?\b/.test(code)) passthrough.push(name);
  }
}
passthrough.sort();

// ── real @helixds packages ─────────────────────────────────────────────────
const packages = fs.readdirSync(path.join(root, 'packages'))
  .map(dir => path.join(root, 'packages', dir, 'package.json'))
  .filter(file => fs.existsSync(file))
  .map(file => JSON.parse(fs.readFileSync(file, 'utf8')).name)
  .filter(name => name?.startsWith('@helixds/'))
  .sort();

const data = { antiSynonyms, valueSynonyms, props, colors, primitives, spacing, passthrough, coreExports: [...coreExports].sort(), packages };
fs.writeFileSync(path.join(pkg, 'src/data.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`✅ src/data.json — ${Object.keys(antiSynonyms).length} anti-synonyms, ${Object.keys(props).length} components, ${Object.keys(colors).length} token colors, ${Object.keys(spacing).length} spacing values, ${passthrough.length} components taking HTML attributes, ${coreExports.size} core exports`);
