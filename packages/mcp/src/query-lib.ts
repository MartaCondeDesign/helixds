/**
 * Read-only query layer for Helix's agent context.
 *
 * Keep data access here, independent of the interface: the terminal CLI (scripts/helix-cli.ts, through
 * scripts/helix-query-lib.ts) and the MCP server both call these same functions — no duplicated search or
 * ranking. Which files they read — the repo's sources or an install's packages — is ./sources.ts's call.
 */
import fs from 'fs';
import path from 'path';
import { isAlias, toCss } from '../../tokens/src/dtcg.mjs';
import { sources } from './sources.ts';

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;

type ManifestEntry = {
  name: string;
  category: string;
  status: string;
  version: string;
  purpose: string;
  contract: string;
};
type Manifest = { components: ManifestEntry[] };
type Contract = {
  name: string;
  purpose: string;
  import?: string;
  neverUseFor?: string[];
  rationale?: string;
  governance?: { mayExtendLocally?: string[]; mustEscalateToDS?: string[] };
  states?: Record<string, unknown>;
  props?: Array<{ name: string; type: string; required?: boolean; default?: unknown; description: string }>;
  tokenPolicy?: { allowed?: string[]; forbidden?: string[] };
  a11y?: { role?: string; keyboardNav?: string[]; wcag?: string[] };
};
type TokenLeaf = { $value: unknown; $type?: string; $description?: string; $extensions?: Record<string, unknown> };

/** A token's value as CSS — the alias itself, or its DTCG 2025.10 value rendered ("#2563eb", "16px"). */
const cssOf = (token: TokenLeaf) => (isAlias(token.$value) ? token.$value : toCss(token.$value, token.$type, { extensions: token.$extensions }));

function manifest(): Manifest {
  return readJson<Manifest>(sources().manifest);
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function score(query: string, text: string): number {
  const q = normalized(query);
  const target = normalized(text);
  if (!q) return 0;
  if (target === q) return 100;
  if (target.startsWith(q)) return 80;
  if (target.includes(q)) return 60;
  return q.split(' ').filter(word => target.includes(word)).length * 10;
}

export function listComponents(status?: string) {
  return manifest().components
    .filter(component => !status || component.status === status)
    .map(({ name, category, status, version, purpose, contract }) => ({
      name, category, status, version, purpose, import: readJson<Contract>(sources().contract(contract)).import ?? null,
    }));
}

export function getComponent(name: string) {
  const entry = manifest().components.find(component => component.name.toLowerCase() === name.toLowerCase());
  if (!entry) return undefined;
  const contract = readJson<Contract>(sources().contract(entry.contract));
  return {
    ...entry,
    // First, so an agent sees where to import from before anything else (agents guessed @helix/react).
    import: contract.import ?? null,
    props: contract.props ?? [],
    neverUseFor: contract.neverUseFor ?? [],
    rationale: contract.rationale ?? null,
    governance: contract.governance ?? null,
    states: contract.states ?? {},
    tokenPolicy: contract.tokenPolicy ?? {},
    accessibility: contract.a11y ?? {},
    suggestedNext: [`pnpm helix pattern search-filter --json`, `pnpm helix token color.fill.primary-interactive-default --json`],
  };
}

function flattenTokens(value: Record<string, unknown>, prefix = ''): Array<{ path: string; token: TokenLeaf }> {
  return Object.entries(value).flatMap(([key, child]) => {
    const tokenPath = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && '$value' in child) {
      return [{ path: tokenPath, token: child as TokenLeaf }];
    }
    return child && typeof child === 'object'
      ? flattenTokens(child as Record<string, unknown>, tokenPath)
      : [];
  });
}

export function getToken(tokenPath: string) {
  const token = flattenTokens(readJson<Record<string, unknown>>(sources().tokensJson))
    .find(entry => entry.path === tokenPath || entry.path === `semantic.${tokenPath}`);
  if (!token) return undefined;
  return {
    path: token.path.replace(/^semantic\./, ''),
    value: token.token.$value,
    css: cssOf(token.token),
    type: token.token.$type,
    description: token.token.$description,
    cssVariable: `--helix-${token.path.replace(/^semantic\./, '').replace(/\./g, '-')}`,
  };
}

export function getPattern(name: string) {
  const file = `${name.replace(/\.md$/, '')}.md`;
  const patternPath = path.join(sources().patterns, file);
  if (path.basename(file) !== file || !fs.existsSync(patternPath)) return undefined;
  return { name: file.replace(/\.md$/, ''), source: sources().patternSource(file), guidance: fs.readFileSync(patternPath, 'utf8') };
}

export function search(query: string) {
  const componentMatches = manifest().components
    .map(component => {
      const contract = readJson<Contract>(sources().contract(component.contract));
      return { ...component, score: score(query, `${component.name} ${JSON.stringify(contract)}`) };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 8)
    .map(({ name, category, status, purpose }) => ({ kind: 'component', name, category, status, purpose }));

  const patternDir = sources().patterns;
  const patternMatches = fs.readdirSync(patternDir).filter(file => file.endsWith('.md')).map(file => {
    const guidance = fs.readFileSync(path.join(patternDir, file), 'utf8');
    return { name: file.replace(/\.md$/, ''), guidance, score: score(query, `${file} ${guidance}`) };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)
    .map(({ name }) => ({ kind: 'pattern', name, source: sources().patternSource(`${name}.md`) }));

  const tokenMatches = flattenTokens(readJson<Record<string, unknown>>(sources().tokensJson))
    .map(entry => ({ ...entry, score: score(query, entry.path) }))
    .filter(result => result.score > 0 && result.path.startsWith('semantic.'))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, 8)
    .map(({ path: tokenPath, token }) => ({ kind: 'token', path: tokenPath.replace(/^semantic\./, ''), value: cssOf(token), type: token.$type }));

  return { query, results: [...componentMatches, ...patternMatches, ...tokenMatches] };
}

// ── Token search by concept ──────────────────────────────────────────────────
// People and agents describe a token by what it's for ("danger background", "hover border"); token paths use
// Helix's own grammar (fill.danger-interactive-default). Each concept maps the everyday words to the path
// segment that carries that meaning, so the search can bridge the two vocabularies.
const CONCEPTS: Record<string, string[]> = {
  fill: ['background', 'bg', 'fill', 'surface', 'backdrop'],
  text: ['text', 'foreground', 'fg', 'copy', 'font'],
  icon: ['icon', 'glyph'],
  border: ['border', 'outline', 'stroke', 'divider', 'separator'],
  danger: ['danger', 'error', 'destructive', 'delete', 'invalid', 'negative'],
  success: ['success', 'positive', 'ok', 'valid', 'confirm'],
  warning: ['warning', 'caution', 'alert'],
  info: ['info', 'informational', 'note', 'tip'],
  primary: ['primary', 'brand', 'accent'],
  secondary: ['secondary'],
  neutral: ['neutral', 'gray', 'grey', 'muted', 'body'],
  hover: ['hover', 'hovered'],
  press: ['press', 'pressed', 'active'],
  disabled: ['disabled', 'inactive'],
  focus: ['focus', 'focused', 'ring'],
  light: ['light', 'subtle', 'tint', 'soft', 'lighter'],
  dark: ['dark', 'strong', 'darker'],
  page: ['page', 'canvas', 'app'],
  inverse: ['inverse', 'inverted', 'on'],
  link: ['link', 'anchor'],
  chart: ['chart', 'series', 'graph', 'visualization', 'dataviz'],
  spacing: ['spacing', 'space', 'gap', 'padding', 'margin'],
  radius: ['radius', 'corner', 'corners', 'rounded', 'rounding'],
  shadow: ['shadow', 'elevation'],
  duration: ['duration', 'speed', 'timing'],
  easing: ['easing', 'curve'],
};
const CONCEPT_OF = new Map(Object.entries(CONCEPTS).flatMap(([segment, words]) => words.map(word => [word, segment] as const)));

/** Resolved light and dark values of every CSS variable, read from the built helix.css. */
function cssValues() {
  const css = fs.readFileSync(sources().helixCss, 'utf8');
  const darkStart = css.indexOf(':root[data-theme="dark"]');
  const darkEnd = css.indexOf('}', darkStart);
  const decls = (chunk: string) => new Map([...chunk.matchAll(/(--helix-[\w-]+):\s*([^;]+);/g)].map(m => [m[1]!, m[2]!.trim()]));
  const light = decls(css.slice(0, darkStart));
  const darkOnly = decls(css.slice(darkStart, darkEnd));
  // Aliases are emitted as var(--helix-…) chains; follow them so callers still get the final value.
  const resolve = (name: string, layer: Map<string, string>, depth = 0): string | undefined => {
    const value = layer.get(name) ?? light.get(name);
    const ref = value?.match(/^var\((--helix-[\w-]+)\)$/)?.[1];
    return ref && depth < 20 ? resolve(ref, layer, depth + 1) : value;
  };
  const resolved = (names: Iterable<string>, layer: Map<string, string>) =>
    new Map([...names].map(n => [n, resolve(n, layer)!] as const));
  return { light: resolved(light.keys(), new Map()), dark: resolved(darkOnly.keys(), darkOnly) };
}

export function searchTokens(query: string, limit = 8) {
  const words = normalized(query).split(' ').filter(Boolean);
  const { light, dark } = cssValues();
  const semantic = flattenTokens(readJson<Record<string, unknown>>(sources().tokensJson))
    .filter(entry => entry.path.startsWith('semantic.') && entry.token.$type !== 'typography');
  // Words that name no part of any token path ("button", "card") can't narrow the search — report them
  // as ignored instead of letting them block every match.
  const known = new Set(semantic.flatMap(entry => entry.path.replace(/^semantic\./, '').split(/[.-]/)));
  const candidates = [...new Set(words.map(word => CONCEPT_OF.get(word) ?? word))];
  const concepts = candidates.filter(concept => known.has(concept));
  const ignored = words.filter(word => !known.has(CONCEPT_OF.get(word) ?? word));

  const ranked = semantic
    .map(entry => {
      const tokenPath = entry.path.replace(/^semantic\./, '');
      const segments = new Set(tokenPath.split(/[.-]/));
      const matched = concepts.filter(concept => segments.has(concept));
      const description = normalized(entry.token.$description ?? '');
      const descriptionHits = words.filter(word => description.includes(word)).length;
      const cssVariable = `--helix-${tokenPath.replace(/\./g, '-')}`;
      return {
        path: tokenPath,
        cssVariable,
        usage: `var(${cssVariable})`,
        type: entry.token.$type,
        description: entry.token.$description ?? null,
        light: light.get(cssVariable) ?? null,
        dark: dark.get(cssVariable) ?? light.get(cssVariable) ?? null,
        matched,
        // Concepts in the path count most; a description mention breaks ties; shorter paths are the base tone.
        score: matched.length * 10 + descriptionHits - segments.size * 0.1,
      };
    })
    .filter(result => result.matched.length > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  const complete = ranked.filter(result => result.matched.length === concepts.length);
  return {
    query,
    concepts,
    ignored,
    note: !concepts.length ? 'None of these words names a token role, surface or state — try e.g. "danger background", "subtle text", "focus border".'
      : complete.length ? null : `No token matches all of [${concepts.join(', ')}] — these are the closest partial matches.`,
    results: (complete.length ? complete : ranked).slice(0, limit).map(({ score: _score, ...rest }) => rest),
  };
}
