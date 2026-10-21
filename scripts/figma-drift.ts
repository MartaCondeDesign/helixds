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
 * Behaviour-only changes ({Name}.tsx logic, stories, docs) don't count: they don't change what Figma shows — but a
 * story Figma has no approved representation for does (figma-map.md's **Stories → Figma:** ✗, contract figma.stories).
 *
 *   synced   in Figma, audited, nothing visual changed since  ✓
 *   drift    in Figma, but not audited, or something visual
 *            changed since                                    ⚠  (lists what)
 *   missing  not in Figma                                    ✗
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { isAlias, toCss } from '../packages/tokens/src/dtcg.mjs';

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

// A component's tokens as the CSS they produce: each literal $value rendered by the DTCG converter, so moving
// tokens.json to DTCG 2025.10 shapes ("250ms" → { value: 250, unit: "ms" }) doesn't read as a design change.
function asCss(node: any): any {
  if (!node || typeof node !== 'object') return node;
  if ('$value' in node) {
    // Both sides of the comparison go through here — an older commit's plain "250ms"/0.15 and today's
    // { value: 250, unit: "ms" }/0.15 all come out as the same CSS string.
    const v = node.$value;
    const value = isAlias(v) || node.$type === 'typography' ? v
      : typeof v === 'string' || typeof v === 'number' ? String(v)
      : toCss(v, node.$type, { extensions: node.$extensions });
    const { $extensions, ...rest } = node;
    return { ...rest, $value: value };
  }
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, asCss(v)]));
}

function tokensFor(json: string | null, name: string): string {
  if (!json) return '';
  const key = name.charAt(0).toLowerCase() + name.slice(1);
  return JSON.stringify(asCss(JSON.parse(json).component?.[key] ?? null));
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
  // Harness (2026-10-02): "in Figma" is not enough — the Figma set must have passed
  // scripts/figma/audit-component.js (bound colors, bound spacing, no spacer nodes, every state of the
  // contract's figma.states, color parity with code in light and dark) at the commit it was synced against.
  const audit = figmaEntry.audit;
  if (!audit?.pass) return { state: 'drift', details: ['Not audited — run scripts/figma/audit-component.js and record the passing result in figma-sync.json (components-to-figma.md, Phase 6)'] };
  if (figmaEntry.syncedCommit && audit.commit !== figmaEntry.syncedCommit) return { state: 'drift', details: [`Audit is for ${String(audit.commit).slice(0, 7)}, not the synced commit ${String(figmaEntry.syncedCommit).slice(0, 7)} — re-run the audit`] };
  // Exact property parity (root CLAUDE.md rule 16): every code prop has its Figma property with the same name and
  // kind — read from .ai/maps/figma-map.md (pnpm docs:figma-map, Figma side from .ai/figma-props.json).
  const map = readNow('.ai/maps/figma-map.md') ?? '';
  const section = map.split(/^### /m).find(sec => sec.startsWith(`${name} (`)) ?? '';
  const mismatched = section.split('\n').filter(l => /\| ✗[^|]*\|\s*$/.test(l)).map(l => l.split(/(?<!\\)\|/)[3]?.trim().replace(/`/g, '')).filter(Boolean);
  if (mismatched.length) return { state: 'drift', details: [`Figma properties differ from the code props (${mismatched.length}): ${mismatched.join(', ')} — see .ai/maps/figma-map.md`] };
  const figmaOnly = section.split('\n').find(l => l.startsWith('**Only in Figma:** ✗'));
  if (figmaOnly) return { state: 'drift', details: [`Figma has properties no code prop has — ${figmaOnly.replace('**Only in Figma:** ✗ ', '')} (.ai/maps/figma-map.md)`] };
  const propsDiff = section.split('\n').find(l => l.startsWith('**Storybook props:** ✗'));
  if (propsDiff) return { state: 'drift', details: [`Storybook's props table and the contract list different props — ${propsDiff.replace('**Storybook props:** ✗ ', '')} (.ai/maps/figma-map.md)`] };
  const storyOrder = section.split('\n').find(l => l.startsWith('**Storybook order:** ✗'));
  if (storyOrder) return { state: 'drift', details: [`Storybook doesn't list the Figma variants first — ${storyOrder.replace('**Storybook order:** ✗ ', '')} (.ai/maps/figma-map.md)`] };
  const order = section.split('\n').find(l => l.startsWith('**Property order:** ✗'));
  if (order) return { state: 'drift', details: [`Figma properties are not in the code's order — ${order.replace('**Property order:** ✗ ', '')} (.ai/maps/figma-map.md)`] };
  // Story coverage (contracts/figma-conversion.json → storyCoverage): every Storybook story says how Figma draws it.
  const storiesLine = section.split('\n').find(l => l.startsWith('**Stories → Figma:** ✗'));
  if (storiesLine) {
    const unmapped = section.split('\n').filter(l => /^- `[^`]+` → ✗/.test(l)).map(l => l.match(/^- `([^`]+)`/)![1]);
    return { state: 'drift', details: [`Storybook stories with no approved Figma representation (${unmapped.length}): ${unmapped.join(', ')} — ask the owner, record it in the contract's figma.stories (.ai/maps/figma-map.md)`] };
  }
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
