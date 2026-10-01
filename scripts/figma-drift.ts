/**
 * Figma drift — is a component that's in Figma still aligned with its code? (ADR-018, criterion 9)
 *
 * contracts/figma-sync.json records WHEN each component was last synced to Figma (`syncedCommit`, or the
 * older `lastChecked` date). This compares everything visual about the component at that point against the
 * working tree now:
 *
 *   tokens    its own `component.{name}` subtree in packages/tokens/src/tokens.json
 *   css       every rule in packages/core/src/globals.css whose selector targets one of its anatomy parts
 *             (exact `data-helix-part="…"` match, so Chip doesn't pick up ChipGroup's rules)
 *   types     {Name}.types.ts — prop names and value unions (comments ignored)
 *   contract  props, anatomy, sizing and states (status/version ignored — verify:stable rewrites status)
 *
 * Behaviour-only changes ({Name}.tsx logic, stories, docs) don't count: they don't change what Figma shows.
 *
 *   synced   in Figma, nothing visual changed since         ✓
 *   drift    in Figma, but something visual changed since   ⚠  (lists what)
 *   missing  not in Figma                                    ✗
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export type FigmaState = 'synced' | 'drift' | 'missing';
export type FigmaCheck = { state: FigmaState; details: string[]; syncedAt?: string };

const root = path.resolve(__dirname, '..');
const TOKENS = 'packages/tokens/src/tokens.json';
const CSS = 'packages/core/src/globals.css';

const git = (cmd: string) => execSync(`git ${cmd}`, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const showAt = (rev: string, file: string): string | null => {
  try { return git(`show ${rev}:${file}`); } catch { return null; }
};
const readNow = (file: string): string | null => {
  const p = path.join(root, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
};

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Innermost `selector { body }` rules targeting any of the given parts, normalized. */
function cssRulesFor(css: string, parts: string[]): string[] {
  const clean = stripComments(css);
  const out: string[] = [];
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = squash(m[1]!);
    if (parts.some(p => selector.includes(`data-helix-part="${p}"`))) out.push(`${selector} { ${squash(m[2]!)} }`);
  }
  return out.sort();
}

function tokensFor(json: string | null, name: string): string {
  if (!json) return '';
  const key = name.charAt(0).toLowerCase() + name.slice(1);
  return JSON.stringify(JSON.parse(json).component?.[key] ?? null);
}

// Props with no visual representation in Figma — event handlers, ARIA wiring, form plumbing, DOM passthrough.
const NON_VISUAL = (name: string) => /^on[A-Z]/.test(name) || name.startsWith('aria-') || ['className', 'id', 'name', 'ref', 'style', 'value', 'defaultValue', 'invalidAttempt'].includes(name);

/** Visual shape of the contract — prop names/types/defaults, part names, sizing, state names. Prose ignored. */
function contractVisual(json: string | null): string {
  if (!json) return '';
  const c = JSON.parse(json);
  return JSON.stringify({
    props: (c.props ?? []).filter((p: any) => !NON_VISUAL(p.name)).map((p: any) => [p.name, p.type, p.default ?? null]),
    anatomy: (c.anatomy ?? []).map((a: any) => [a.part, a.element, !!a.optional]),
    sizing: JSON.parse(JSON.stringify(c.sizing ?? null, (k, v) => (k === 'note' || k === 'description' ? undefined : v))),
    states: [...(c.states?.intrinsic ?? []), ...(c.states?.authored ?? []).map((st: any) => (typeof st === 'string' ? st : st.name))],
  });
}

/** Visual prop signatures from a {Name}.types.ts — `name?: type` per line, non-visual props dropped. */
function typesVisual(src: string | null): string {
  if (src === null) return '';
  const sigs = [...stripComments(src).matchAll(/^\s*'?([A-Za-z-]+)'?(\?)?:\s*([^;]+);/gm)]
    .filter(m => !NON_VISUAL(m[1]!))
    .map(m => `${m[1]}${m[2] ?? ''}: ${squash(m[3]!)}`);
  const unions = [...stripComments(src).matchAll(/export type (\w+)\s*=\s*([^;]+);/g)].map(m => `${m[1]} = ${squash(m[2]!)}`);
  return JSON.stringify([...sigs, ...unions].sort());
}

/** The commit Figma was last synced against: explicit `syncedCommit`, else the last commit on `lastChecked`'s day. */
function baselineRev(entry: any): string | null {
  if (entry.syncedCommit) return entry.syncedCommit;
  if (!entry.lastChecked) return null;
  return git(`rev-list -1 --before="${entry.lastChecked} 23:59:59" HEAD`) || null;
}

export function figmaCheck(name: string, contractPath: string, figmaEntry: any | undefined): FigmaCheck {
  if (!figmaEntry?.inFigma) return { state: 'missing', details: ['Not in Figma yet — done on request'] };
  const rev = baselineRev(figmaEntry);
  const syncedAt = figmaEntry.syncedCommit ? `commit ${String(figmaEntry.syncedCommit).slice(0, 7)}` : figmaEntry.lastChecked;
  if (!rev) return { state: 'drift', details: ['No sync point recorded in figma-sync.json — re-check it against code'], syncedAt };

  const contractNow = readNow(contractPath);
  const parts: string[] = contractNow ? (JSON.parse(contractNow).anatomy ?? []).map((a: any) => a.part) : [];
  const typesFile = `packages/core/src/components/${name}/${name}.types.ts`;

  const changed: string[] = [];
  if (tokensFor(showAt(rev, TOKENS), name) !== tokensFor(readNow(TOKENS), name)) changed.push(`tokens (component.${name.charAt(0).toLowerCase() + name.slice(1)})`);

  const cssThen = showAt(rev, CSS), cssNow = readNow(CSS);
  if (cssThen && cssNow) {
    const a = cssRulesFor(cssThen, parts), b = cssRulesFor(cssNow, parts);
    const changedParts = parts.filter(p => {
      const has = (r: string) => r.includes(`data-helix-part="${p}"`);
      return JSON.stringify(a.filter(has)) !== JSON.stringify(b.filter(has));
    });
    if (changedParts.length) changed.push(`CSS (${changedParts.join(', ')})`);
  }

  const typesThen = showAt(rev, typesFile), typesNow = readNow(typesFile);
  if (typesThen !== null && typesNow !== null && typesVisual(typesThen) !== typesVisual(typesNow)) changed.push('props/types');

  if (contractVisual(showAt(rev, contractPath)) !== contractVisual(contractNow)) changed.push('contract (props, anatomy, sizing or states)');

  return changed.length
    ? { state: 'drift', details: [`Changed in code since the last Figma sync (${syncedAt}): ${changed.join('; ')}`], syncedAt }
    : { state: 'synced', details: [], syncedAt };
}
