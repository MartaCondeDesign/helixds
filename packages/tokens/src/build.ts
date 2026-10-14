/**
 * Helix DS token build pipeline
 * DTCG JSON (3 layers) → CSS custom properties + TypeScript constants
 *
 * Layer naming → CSS var:
 *   primitive.color.blue.600    → --helix-primitive-color-blue-600
 *   semantic.color.fill.primary-interactive-default → --helix-color-fill-primary-interactive-default
 *   component.button.fill.primary-default → --helix-button-fill-primary-default
 *
 * Run: pnpm --filter @helixds/tokens build
 */
import fs from 'fs';
import path from 'path';
import { isAlias, toCss } from './dtcg.mjs';
import { loadResolver } from './resolver.mjs';

// helix.resolver.json (DTCG 2025.10 resolver): tokens.json is the light theme; the theme modifier's dark
// context lays tokens.dark.json on top. Everything below builds from the resolved light tree, plus the dark
// tree for the dark-mode block.
const resolver = loadResolver(path.join(import.meta.dirname, 'helix.resolver.json'));
const tokens = resolver.resolve({ theme: 'light' }) as Record<string, unknown>;

const dist = path.resolve(import.meta.dirname, '../dist');
fs.mkdirSync(dist, { recursive: true });

// ─── Types ────────────────────────────────────────────────────────────────────

// $value follows DTCG 2025.10 (./dtcg.mjs): an alias string, or the type's own shape — a color object,
// { value, unit }, a cubicBezier array… — rendered to CSS by toCss(). A typography token
// (semantic.textStyle.*) is the one composite that becomes one CSS var per sub-property; each sub-property
// is an alias ({primitive.fontSize.s}) or a literal of its own type — see flatten()/buildTs() below.
type TokenNode = { $value: unknown; $type: string; $description?: string; $extensions?: Record<string, unknown> };

function isComposite(token: TokenNode): token is TokenNode & { $value: Record<string, unknown> } {
  return token.$type === 'typography';
}
// The DTCG type of each typography sub-property, to render a literal one (letterSpacing: { value: 0, unit: 'px' }).
const TYPOGRAPHY_TYPES: Record<string, string> = { fontFamily: 'fontFamily', fontSize: 'dimension', fontWeight: 'fontWeight', letterSpacing: 'dimension', lineHeight: 'number' };

/** A token's CSS value: an alias resolved through the tree, anything else rendered by the DTCG converter. */
function cssOf(value: unknown, type: string | undefined, root: Tree, extensions?: Record<string, unknown>): string {
  return isAlias(value) ? resolveRef(value, root) : toCss(value, type, { extensions, ref: v => resolveRef(v, root) });
}
type Tree = Record<string, unknown>;
type CSSVar = {
  name: string; value: string; layer: 'primitive' | 'semantic' | 'component'; description?: string | undefined;
  /** CSS var this token directly aliases ({semantic.color.fill.page} → --helix-color-fill-page), if any. */
  alias?: string | undefined;
};

// Same naming rule flatten() uses, applied to a DTCG reference path.
function refToCssVar(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\{[^}]+\}$/.test(value)) return undefined;
  const [layer, ...rest] = value.slice(1, -1).split('.');
  return '--helix-' + (layer === 'primitive' ? ['primitive', ...rest] : rest).join('-');
}

// ─── Resolve DTCG references ({a.b.c} → value) ───────────────────────────────

function resolveRef(value: string, root: Tree): string {
  if (!isAlias(value)) return value;
  const refPath = value.slice(1, -1).split('.');
  let node: unknown = root;
  for (const key of refPath) {
    // Composite token ($value is an object, e.g. semantic.textStyle.*) reached with path segments
    // still remaining — those segments index into $value (fontSize/fontWeight/...), not the token
    // node itself, since a composite's sub-properties live one level deeper than a normal leaf's.
    if (node && typeof node === 'object' && '$value' in node && isComposite(node as TokenNode)) {
      const sub = ((node as TokenNode).$value as Record<string, unknown>)[key];
      // A literal sub-property ({ value, unit }) is rendered here; an alias is followed below.
      node = isAlias(sub) || sub === undefined ? sub : toCss(sub, TYPOGRAPHY_TYPES[key]);
      continue;
    }
    if (typeof node !== 'object' || node === null) {
      throw new Error(`Cannot resolve token: ${value} — failed at key '${key}'`);
    }
    node = (node as Record<string, unknown>)[key];
  }
  if (typeof node === 'string') return resolveRef(node, root); // landed on a composite sub-property's alias/literal
  if (typeof node === 'object' && node !== null && '$value' in node) {
    const t = node as TokenNode;
    if (isComposite(t)) {
      throw new Error(`Token reference ${value} resolved to a composite token — reference one of its sub-properties instead.`);
    }
    return cssOf(t.$value, t.$type, root, t.$extensions);
  }
  throw new Error(`Token reference ${value} did not resolve to a leaf token`);
}

// ─── Flatten tree to CSS vars ─────────────────────────────────────────────────

function flatten(obj: Tree, root: Tree, prefix: string[], layer: CSSVar['layer']): CSSVar[] {
  return Object.entries(obj).flatMap(([key, val]) => {
    if (key.startsWith('$')) return [];
    const node = val as Tree;
    if ('$value' in node) {
      const token = node as unknown as TokenNode;

      // CSS name strategy per layer:
      // primitive.*  → --helix-primitive-{path}
      // semantic.*   → --helix-{path} (strip 'semantic.' prefix)
      // component.*  → --helix-{path} (strip 'component.' prefix)
      const basePrefix = layer === 'primitive' ? ['primitive', ...prefix] : prefix;

      if (isComposite(token)) {
        // One CSS var per sub-property — e.g. semantic.textStyle.body-s-medium.fontSize →
        // --helix-textStyle-body-s-medium-fontSize. A sub-value is an alias or a literal of its own type.
        return Object.entries(token.$value).map(([subKey, subVal]) => {
          const name = '--helix-' + [...basePrefix, key, subKey].join('-').replace(/\./g, '-');
          return { name, value: cssOf(subVal, TYPOGRAPHY_TYPES[subKey], root), layer, description: token.$description, alias: refToCssVar(subVal) };
        });
      }

      const rawValue = cssOf(token.$value, token.$type, root, token.$extensions);
      const name = '--helix-' + [...basePrefix, key].join('-').replace(/\./g, '-');
      return [{ name, value: rawValue, layer, description: token.$description, alias: refToCssVar(token.$value) }];
    }
    return flatten(node, root, [...prefix, key], layer);
  });
}

// ─── Extract by layer ─────────────────────────────────────────────────────────

const primitiveVars = flatten(tokens['primitive'] as Tree, tokens, [], 'primitive');
const semanticVars  = flatten(tokens['semantic']  as Tree, tokens, [], 'semantic');
const componentVars = flatten(tokens['component'] as Tree, tokens, [], 'component');

const allVars = [...primitiveVars, ...semanticVars, ...componentVars];

// ─── Dark theme: the resolver's "dark" context ────────────────────────────────
//
// Dark values live in tokens.dark.json (the theme modifier's dark context in helix.resolver.json), not here.
// Aliases are resolved after the dark tokens are laid on top (DTCG 2025.10 resolver), so every token that
// aliases a dark token follows it: a component color aliasing a semantic color takes that color's dark value
// with no entry of its own (the rule build.ts used to enforce by hand, 2026-10-02). The dark block lists every
// CSS var whose resolved value differs between the themes, with its literal dark value.
const darkTokens = resolver.resolve({ theme: 'dark' }) as Record<string, unknown>;
const darkVars = [
  ...flatten(darkTokens['primitive'] as Tree, darkTokens, [], 'primitive'),
  ...flatten(darkTokens['semantic'] as Tree, darkTokens, [], 'semantic'),
  ...flatten(darkTokens['component'] as Tree, darkTokens, [], 'component'),
];
const lightValue = new Map(allVars.map(v => [v.name, v.value]));
const darkOnly = darkVars.filter(v => lightValue.get(v.name) !== v.value);

// ─── Mobile viewport: the resolver's "viewport" modifier ───────────────────────
//
// helix.resolver.json's viewport modifier: desktop (default — tablet shares it) is tokens.json as is; its mobile
// context (tokens.mobile.json) points each primitive.fontSize rung >= 18px at semantic.fontSize.mobile.* (87.5%).
// The CSS writes only the tokens that context redefines, below primitive.breakpoint.tablet, and every
// textStyle/component font size reaches the new size through its var() chain (see "Alias chaining" below) —
// e.g. heading-xl is 24px → 21px on mobile.

const tabletBreakpointPx = Number(
  resolveRef('{primitive.breakpoint.tablet}', tokens).replace('px', ''),
);
const mobileMaxWidthPx = tabletBreakpointPx - 1;

const mobileTokens = resolver.resolve({ viewport: 'mobile' }) as Record<string, unknown>;
const mobileVars = (['primitive', 'semantic', 'component'] as const)
  .flatMap(layer => flatten(mobileTokens[layer] as Tree, mobileTokens, [], layer));
const lightVar = new Map(allVars.map(v => [v.name, v]));
// A token the context redefines changes its own value or its alias target; a token that merely aliases one
// keeps the same alias and needs no line of its own.
const mobileFontSizeOverrides = mobileVars.filter(v => {
  const base = lightVar.get(v.name);
  return !!base && (base.alias !== v.alias || (!base.alias && base.value !== v.value));
});

// ─── Alias chaining ───────────────────────────────────────────────────────────
//
// An alias is written as `var(--helix-<target>)` instead of its inlined value, so the CSS itself
// shows the primitive → semantic → component chain (agents and audits reading helix.css can see
// that fill-surface IS gray-50), and an override on the target reaches everything built on it:
// the mobile fontSize override above now shrinks headings too. The dark block writes literal values for
// every var that changes, so it doesn't depend on the chain.
const byName = new Map(allVars.map(v => [v.name, v]));
const chained = new Set(allVars.filter(v => v.alias && byName.has(v.alias)).map(v => v.name));
const cssValue = (v: CSSVar) => (chained.has(v.name) ? `var(${v.alias})` : v.value);

// ─── Write CSS ────────────────────────────────────────────────────────────────

const sections = {
  primitive: primitiveVars.map(v => `  ${v.name}: ${cssValue(v)};`).join('\n'),
  semantic:  semanticVars.map(v => `  ${v.name}: ${cssValue(v)};${v.description ? ` /* ${v.description} */` : ''}`).join('\n'),
  component: componentVars.map(v => `  ${v.name}: ${cssValue(v)};`).join('\n'),
  dark2:     darkOnly.map(v => `  ${v.name}: ${v.value};`).join('\n'),
  dark4:     darkOnly.map(v => `    ${v.name}: ${v.value};`).join('\n'),
  mobileFontSize: mobileFontSizeOverrides.map(v => `    ${v.name}: ${v.value};`).join('\n'),
};

const css = `/* ============================================================
   Helix DS — Generated design tokens
   Source: packages/tokens/src/tokens.json
   DO NOT EDIT — run pnpm --filter @helixds/tokens build
   ============================================================ */

/* ── Primitive tokens (raw scale) ───────────────────────────── */
:root {
${sections.primitive}
}

/* ── Semantic tokens (role aliases) ─────────────────────────── */
:root {
${sections.semantic}
}

/* ── Component tokens (component-specific) ──────────────────── */
:root {
${sections.component}
}

/* ── Dark mode overrides ─────────────────────────────────────── */
/* Explicit toggle wins first */
:root[data-theme="dark"] {
${sections.dark2}
}

/* OS preference (only when no explicit light override) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${sections.dark4}
  }
}

/* ── Responsive typography — mobile fontSize override ────────── */
/* Below primitive.breakpoint.tablet (${tabletBreakpointPx}px); tablet+desktop share the base size above,
   so one query covers both. See semantic.fontSize.mobile.* for the source values. */
@media (max-width: ${mobileMaxWidthPx}px) {
  :root {
${sections.mobileFontSize}
  }
}
`;

fs.writeFileSync(path.join(dist, 'helix.css'), css);

// ─── Write TypeScript constants ───────────────────────────────────────────────

function buildTs(obj: Tree, root: Tree, indent = 1): string[] {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const node = val as Tree;
    // A key needs quoting if it has any non-identifier character, OR starts with a digit — the
    // original check only tested the first case, which let `2xl`/`100` (spacing/size/fontSize scale
    // keys — all valid characters, just an invalid identifier START) through unquoted, producing
    // syntactically invalid object literals (`2xl: '32px'`) in dist/index.ts.
    const safeKey = /[^a-zA-Z0-9_$]/.test(key) || /^[0-9]/.test(key) ? `'${key}'` : key;
    if ('$value' in node) {
      const token = node as unknown as TokenNode;
      if (isComposite(token)) {
        lines.push(`${pad}${safeKey}: {`);
        for (const [subKey, subVal] of Object.entries(token.$value)) {
          lines.push(`${pad}  ${subKey}: '${cssOf(subVal, TYPOGRAPHY_TYPES[subKey], root)}',`);
        }
        lines.push(`${pad}},`);
      } else {
        const value = cssOf(token.$value, token.$type, root, token.$extensions);
        lines.push(`${pad}${safeKey}: '${value}',`);
      }
    } else {
      lines.push(`${pad}${safeKey}: {`);
      lines.push(...buildTs(node, root, indent + 1));
      lines.push(`${pad}},`);
    }
  }
  return lines;
}

const ts = [
  '// Helix DS — generated token constants',
  '// DO NOT EDIT — run pnpm --filter @helixds/tokens build',
  '',
  '/** Raw token values, typed as const. Use CSS vars at runtime instead. */',
  'export const tokens = {',
  '  primitive: {',
  ...buildTs(tokens['primitive'] as Tree, tokens, 2),
  '  },',
  '  semantic: {',
  ...buildTs(tokens['semantic'] as Tree, tokens, 2),
  '  },',
  '  component: {',
  ...buildTs(tokens['component'] as Tree, tokens, 2),
  '  },',
  '} as const;',
  '',
  'export type Tokens = typeof tokens;',
  '',
  '/** CSS variable names for all tokens (for use with getComputedStyle) */',
  'export const cssVars = {',
  ...allVars.map(v => {
    const key = v.name.replace('--helix-', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return `  '${key}': '${v.name}',`;
  }),
  '} as const;',
].join('\n');

fs.writeFileSync(path.join(dist, 'index.ts'), ts);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('✅ Helix tokens built');
console.log(`   Primitive: ${primitiveVars.length} vars`);
console.log(`   Semantic:  ${semanticVars.length} vars`);
console.log(`   Component: ${componentVars.length} vars`);
console.log(`   Total:     ${allVars.length} CSS custom properties`);
console.log(`   Dark mode: ${darkOnly.length} vars change (tokens.dark.json via helix.resolver.json)`);
console.log(`   Chained:   ${chained.size}/${allVars.filter(v => v.alias).length} aliases emitted as var()`);
