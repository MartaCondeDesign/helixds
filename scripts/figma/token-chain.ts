/**
 * From a `--helix-*` CSS variable to the token chain behind it, and to the Figma variable / Text Style that
 * should be bound — the "is it bound to the CORRECT variable" half of the Figma audit.
 *
 * Rules (components-to-figma.md → "Bind to variables"): there is no Component collection in Figma, so a
 * property binds to the FIRST non-component token its component.* token aliases (component.button.padding.x-m
 * → semantic.spacing.component-l → bind Semantic `spacing/component/l`, not the primitive under it). Text
 * binds a named Text Style instead: the semantic.textStyle.<key> its fontSize aliases (caption-semibold →
 * "Caption / Semibold").
 *
 * Names are compared normalised (lowercase, `/` `-` `.` and spaces all equal), because Figma splits the
 * hyphenated grammar into `/` folders (fill/primary/interactive/default ↔ color.fill.primary-interactive-default)
 * and drops the category prefix inside Theme.
 */
import fs from 'fs';
import path from 'path';

type Token = { $value?: unknown };
const root = path.resolve(import.meta.dirname, '../..');
const tokens = JSON.parse(fs.readFileSync(path.join(root, 'packages/tokens/src/tokens.json'), 'utf8'));

// Same naming rule as packages/tokens/src/build.ts (refToCssVar / flatten).
const cssVarOf = (p: string[]) => '--helix-' + (p[0] === 'primitive' ? p : p.slice(1)).join('-');
const byCssVar = new Map<string, { path: string; value: unknown }>();
(function flatten(node: Record<string, unknown>, at: string[]) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in (v as object)) byCssVar.set(cssVarOf([...at, k]), { path: [...at, k].join('.'), value: (v as Token).$value });
    else if (v && typeof v === 'object') flatten(v as Record<string, unknown>, [...at, k]);
  }
})(tokens, []);

// A reference into a composite token ({semantic.textStyle.caption-semibold.fontSize}): the parent is the
// token, the last segment a property of its $value object.
function resolve(ref: string): { path: string; value: unknown } | undefined {
  const parts = ref.split('.');
  const direct = byCssVar.get(cssVarOf(parts));
  if (direct) return direct;
  const parent = byCssVar.get(cssVarOf(parts.slice(0, -1)));
  const sub = parent && typeof parent.value === 'object' ? (parent.value as Record<string, unknown>)[parts.at(-1)!] : undefined;
  return sub === undefined ? undefined : { path: ref, value: sub };
}

// --helix-textStyle-body-s-regular-fontSize: the CSS build also emits each property of a composite token
// as its own variable (token var + '-' + property).
function compositeProp(cssVar: string): { path: string; value: unknown } | undefined {
  for (const [name, t] of byCssVar) {
    if (!cssVar.startsWith(name + '-') || typeof t.value !== 'object' || t.value === null) continue;
    const prop = cssVar.slice(name.length + 1);
    if (prop in (t.value as object)) return { path: `${t.path}.${prop}`, value: (t.value as Record<string, unknown>)[prop] };
  }
  return undefined;
}

/** --helix-button-padding-x-m → ['component.button.padding.x-m', 'semantic.spacing.component-l', 'primitive.spacing.100'] */
export function tokenChain(cssVar: string): string[] {
  const chain: string[] = [];
  let cur = byCssVar.get(cssVar) ?? compositeProp(cssVar);
  while (cur && chain.length < 8) {
    chain.push(cur.path);
    const ref = typeof cur.value === 'string' && /^\{[^}]+\}$/.test(cur.value) ? cur.value.slice(1, -1) : null;
    cur = ref ? resolve(ref) : undefined;
  }
  return chain;
}

/** What Figma should bind: the first non-component token, or the Text Style key for typography. */
export function figmaTarget(chain: string[], kind: 'variable' | 'textStyle'): string | null {
  if (kind === 'textStyle') {
    const t = chain.find(p => p.startsWith('semantic.textStyle.'));
    return t ? t.split('.')[2]! : null; // caption-semibold
  }
  return chain.find(p => !p.startsWith('component.')) ?? null;
}

export const normalise = (s: string) => s.toLowerCase().replace(/[\s/.\-]+/g, '.').replace(/^\.|\.$/g, '');
