/**
 * Read-only access to Helix's own sources of truth. Nothing here is copied or cached across calls:
 * every tool call re-reads the files, so the server can never drift from the repo (a contract,
 * token or pattern edited a second ago is what the next call returns).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root: HELIX_ROOT if set, else two levels up from packages/mcp/src. */
export const ROOT = process.env.HELIX_ROOT
  ? path.resolve(process.env.HELIX_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');
const readJson = <T = any>(rel: string): T => JSON.parse(read(rel));

// ── Components ───────────────────────────────────────────────────────────────

export interface ManifestEntry {
  name: string;
  category: string;
  status: string;
  contract: string;
  implementation?: string;
  story?: string;
  [key: string]: unknown;
}

export function manifest(): { components: ManifestEntry[]; drift?: unknown[] } {
  return readJson('contracts/manifest.json');
}

export function findComponent(name: string): ManifestEntry | undefined {
  const wanted = name.trim().toLowerCase();
  return manifest().components.find(c => c.name.toLowerCase() === wanted);
}

export function contract(entry: ManifestEntry): Record<string, any> {
  return readJson(entry.contract);
}

export function stability(name: string): Record<string, any> | undefined {
  const data = readJson<{ components: { name: string }[] }>('contracts/stability.json');
  return data.components.find(c => c.name === name);
}

// ── Tokens ───────────────────────────────────────────────────────────────────

export interface TokenInfo {
  /** DTCG dot path, e.g. semantic.color.text.danger */
  path: string;
  /** CSS custom property, e.g. --helix-color-text-danger */
  cssVar: string;
  layer: 'primitive' | 'semantic' | 'component';
  type?: string;
  /** Raw DTCG $value — an alias like {semantic.color.fill.page} or a literal. */
  source: unknown;
  description?: string;
  /** Resolved value as the built CSS ships it, light theme. */
  light?: string;
  /** Resolved dark-theme value, when it differs from light. */
  dark?: string;
}

/**
 * Same path → CSS variable rule as packages/tokens/src/build.ts: primitives keep their
 * "primitive-" prefix, semantic and component drop their layer name.
 */
export function cssVarFor(dotPath: string): string {
  const [layer, ...rest] = dotPath.split('.');
  const parts = layer === 'primitive' ? ['primitive', ...rest] : rest;
  return `--helix-${parts.join('-')}`;
}

/** Custom properties declared in the built CSS, split into light (:root) and dark overrides. */
function builtValues(): { light: Map<string, string>; dark: Map<string, string> } {
  const css = read('packages/tokens/dist/helix.css');
  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  const blockRe = /(:root(?:\[data-theme="dark"\])?)\s*\{([^}]*)\}/g;
  // The responsive (@media max-width) and prefers-color-scheme blocks restate values already
  // captured — only the plain :root blocks and the explicit dark toggle are read.
  const cut = css.indexOf('@media');
  const scope = cut === -1 ? css : css.slice(0, cut);
  for (const m of scope.matchAll(blockRe)) {
    const target = m[1]!.includes('dark') ? dark : light;
    for (const decl of m[2]!.matchAll(/(--helix-[\w-]+)\s*:\s*([^;]+);/g)) {
      target.set(decl[1]!, decl[2]!.replace(/\/\*.*?\*\//g, '').trim());
    }
  }
  return { light, dark };
}

export function allTokens(): TokenInfo[] {
  const tree = readJson<Record<string, any>>('packages/tokens/src/tokens.json');
  const { light, dark } = builtValues();
  const out: TokenInfo[] = [];

  const walk = (node: Record<string, any>, trail: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$') || !value || typeof value !== 'object') continue;
      const here = [...trail, key];
      if ('$value' in value) {
        const dotPath = here.join('.');
        const cssVar = cssVarFor(dotPath);
        const info: TokenInfo = {
          path: dotPath,
          cssVar,
          layer: here[0] as TokenInfo['layer'],
          source: value.$value,
        };
        if (value.$type) info.type = value.$type;
        if (value.$description) info.description = value.$description;
        if (value.$value && typeof value.$value === 'object') {
          // Composite (a text style): the build emits one variable per property.
          const props = Object.keys(value.$value);
          info.light = props.map(p => `${cssVar}-${p}: ${light.get(`${cssVar}-${p}`) ?? '?'}`).join('; ');
        } else {
          const l = light.get(cssVar);
          const d = dark.get(cssVar);
          if (l !== undefined) info.light = l;
          if (d !== undefined && d !== l) info.dark = d;
        }
        out.push(info);
      } else {
        walk(value, here);
      }
    }
  };
  for (const layer of ['primitive', 'semantic', 'component']) {
    if (tree[layer]) walk(tree[layer], [layer]);
  }
  return out;
}

// ── Prop vocabulary ──────────────────────────────────────────────────────────

export interface PropRule { canonical: string; antiSynonyms: string[]; notes: string; section: string }

/** Every table row of .ai/maps/prop-map.md: | `canonical` | `anti`, `anti` | notes | */
export function propRules(): PropRule[] {
  const md = read('.ai/maps/prop-map.md');
  const rules: PropRule[] = [];
  let section = '';
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) { section = line.slice(3).trim(); continue; }
    const cells = line.split('|').map(c => c.trim());
    if (cells.length < 4) continue;
    const canonical = cells[1]!.match(/`([^`]+)`/)?.[1];
    if (!canonical) continue;
    const antiSynonyms = [...cells[2]!.matchAll(/`([^`]+)`/g)].map(m => m[1]!);
    rules.push({ canonical, antiSynonyms, notes: cells[3] ?? '', section });
  }
  return rules;
}

export function propMapMarkdown(): string {
  return read('.ai/maps/prop-map.md');
}

// ── Patterns + rules ─────────────────────────────────────────────────────────

const PATTERNS_DIR = '.ai/maps/patterns';

export function patterns(): { name: string; category: string; components: string; when: string }[] {
  return fs.readdirSync(path.join(ROOT, PATTERNS_DIR))
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fm = read(`${PATTERNS_DIR}/${f}`).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const field = (k: string) => fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1]?.replace(/^"|"$/g, '') ?? '';
      return { name: field('name') || f.replace(/\.md$/, ''), category: field('category'), components: field('components'), when: field('when') };
    });
}

export function patternMarkdown(name: string): string | undefined {
  const file = path.join(ROOT, PATTERNS_DIR, `${name.replace(/\.md$/, '')}.md`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : undefined;
}

export function agentsGuide(): string {
  return read('AGENTS.md');
}
