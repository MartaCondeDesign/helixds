---
name: tokens-to-figma
description: Transfer ALL Helix DS tokens to Figma — variable collections, text styles, and effect styles
applyTo: []
---

# Skill: Tokens → Figma (complete)

## Scope

Transferring `packages/tokens/src/tokens.json` into native Figma assets: variable collections
(color, spacing, radius, size, typography, font-family, breakpoints), Text Styles (bound to typography
variables), and Effect Styles (shadows). Does not cover: component creation (see `components-to-figma`,
which depends on this skill having run first) or icon import (see `icons-to-figma`).

## Source files to read FIRST (mandatory)

| File | What it gives you |
|------|-------------------|
| `packages/tokens/src/tokens.json` | Source of truth — DTCG, 3 layers |
| `packages/tokens/dist/helix.css` | Exact CSS var names + dark mode overrides |
| `packages/tokens/CLAUDE.md` | Naming rules, "Token layers" overview |

**CSS var naming rule:** strip `primitive.` and `semantic.`, replace `.` with `-`, prepend `--helix-`.

---

## Collection layout (4 collections total)

Everything lives in exactly 4 variable collections, one per role — **not** one per `tokens.json` category.
Multiple token categories that share a role live in the SAME collection:

| Collection | Holds | Modes |
|------------|-------|-------|
| `Primitives` | `primitive.color.*`, `primitive.spacing.*`, `primitive.size.*`, `primitive.fontSize/fontWeight/lineHeight/fontFamily.*`, `primitive.breakpoint.*` | `default` |
| `Theme` | `semantic.color.*` (`fill`/`text`/`icon`/`border`) | `light`, `dark` |
| `Semantic` | `semantic.radius.*`, `semantic.size.control.*`, `semantic.spacing.*` | `default` |
| `Responsive` | Per-breakpoint typography overrides (`fontSize` scaled per breakpoint) | `mobile`, `tablet`, `desktop` |

**Why this shape:** primitives are raw, component-agnostic scales — one bucket regardless of what kind of
value. `Theme` is the one collection designers actually switch modes on (light/dark), so it stays alone.
`Semantic` is everything else with role-based meaning but no light/dark split. `Responsive` is the only
collection where the *mode* itself represents something other than a color theme.

Within `Primitives` and `Semantic`, variable names still carry a category prefix (`color/`, `spacing/`,
`size/`, `fontSize/`, `radius/`) so the picker stays organized despite sharing one collection —
see "Naming rules" below.

---

## Naming rules

**No system prefix on any collection, text style, or effect style.**

| Wrong ❌ | Correct ✅ |
|---------|----------|
| `Helix / Primitives` | `Primitives` |
| `Helix / Theme` | `Theme` |
| `Helix / Caption / Regular` | `Caption / Regular` |
| `shadow / xs` | `shadow / xs` |

**Color family names in Figma = token names in code.** No translation.

| Token in `tokens.json` | Figma variable path |
|------------------------|---------------------|
| `primitive.color.blue.*` | `color/blue/*` |
| `primitive.color.gray.*` | `color/gray/*` |
| `primitive.color.green.*` | `color/green/*` |

**Dot in spacing/size names → hyphen:** `spacing/0.5` and `spacing/12.5` are invalid in Figma → use
`spacing/0-5`, `spacing/12-5`.

**In `Theme`, every grammar segment joins with `/`, not `-`.** A semantic color token's key in
`tokens.json` is a flat hyphenated string — `fill.primary-interactive-light-hover` — per the
`{role}[-interactive][-modifier][-state]` grammar in `packages/tokens/CLAUDE.md`. In Figma, translate each
of those segments into its own `/`-delimited path level instead, so Figma groups them as nested folders in
the variable picker: `fill/primary/interactive/light/hover`, not `fill/primary-interactive-light-hover`.
This is **Figma-only** — `tokens.json` keys and the generated `--helix-*` CSS custom properties keep `-`
throughout (CSS doesn't allow `/` in an identifier), so the CSS var name for that same token stays
`--helix-color-fill-primary-interactive-light-hover`. Do not apply this to the numeric decimal hyphen in
spacing/size primitive names (`spacing/12-5` stays as one segment, not `spacing/12/5` — that `-` encodes a
decimal point, not a grammar segment).

**`Semantic` collection names get a category prefix** since it holds 3 unrelated scales in one place:
`radius/*`, `size/*`, `spacing/*`. Without the prefix, `radius/m` and `spacing/m` would both want
to be plain `m` and collide.

---

## Overview of what to create

| Figma asset | Source | Collection | Variable name pattern |
|------------|--------|------------|------------------------|
| Color primitives | `primitive.color.*` | `Primitives` | `color/{family}/{step}` |
| Spacing primitives | `primitive.spacing.*` (percentage scale, `100` = 16px anchor) | `Primitives` | `spacing/{pct}` |
| Size primitives | `primitive.size.*` (same anchor as spacing) | `Primitives` | `size/{pct}` |
| Typography primitives | `primitive.fontSize/fontWeight/lineHeight/fontFamily.*` | `Primitives` | `fontSize/*`, `fontWeight/*`, `lineHeight/*`, `fontFamily/*` |
| Semantic color | `semantic.color.*` | `Theme` | `fill/*`, `text/*`, `icon/*`, `border/*` — 2 modes: light / dark |
| Semantic radius | `semantic.radius.*` (no primitive layer exists for radius) | `Semantic` | `radius/{size}` |
| Semantic size | `semantic.size.control.{xs,s,m,l,xl}` | `Semantic` | `size/{size}` |
| Semantic spacing | `semantic.spacing.{xs,s,m,l,xl}` | `Semantic` | `spacing/{size}` |
| Responsive typography | per-breakpoint `fontSize` | `Responsive` | `fontSize/*` — 3 modes: mobile / tablet / desktop |
| Text Styles | Semantic text matrix | — (Text Styles, not variables) | Named `{role} / {weight}` |
| Effect Styles | `primitive.shadow.*` | — (Effect Styles, not variables) | Named `shadow / {scale}` |

---

## Helpers (paste into every script)

```js
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  return { r, g, b, a: 1 };
}

function buildVarMap() {
  const map = {};
  figma.variables.getLocalVariables().forEach(v => { map[v.name] = v; });
  return map;
}

function getOrCreateCollection(name) {
  const existing = figma.variables.getLocalVariableCollections()
    .find(c => c.name === name);
  return existing || figma.variables.createVariableCollection(name);
}
// COLLECTION NAME RULE: exactly 4 collections total — 'Primitives', 'Theme', 'Semantic', 'Responsive'.
// Never create a 5th (e.g. a separate 'Spacing' or 'Radius' collection) — see "Collection layout" above.
```

---

## Process

### Phase 1 — Primitive color variables (→ `Primitives`)

Scopes empty → hidden in design tool pickers.
10 steps per family (50→900). Gray also includes step 0 (white) and 800 (used in dark mode).

```js
const primColl = getOrCreateCollection('Primitives');
primColl.renameMode(primColl.modes[0].modeId, 'default');
const modeId = primColl.modes[0].modeId;

const primitiveColors = {
  // blue (50–900, no 950)
  'color/blue/50':  '#eff6ff',
  'color/blue/100': '#dbeafe',
  'color/blue/200': '#bfdbfe',
  'color/blue/300': '#93c5fd',
  'color/blue/400': '#60a5fa',
  'color/blue/500': '#3b82f6',
  'color/blue/600': '#2563eb',
  'color/blue/700': '#1d4ed8',
  'color/blue/800': '#1e40af',
  'color/blue/900': '#1e3a8a',
  // gray (0 + 50–900, no 950)
  'color/gray/0':   '#ffffff',
  'color/gray/50':  '#f8fafc',
  'color/gray/100': '#f1f5f9',
  'color/gray/200': '#e2e8f0',
  'color/gray/300': '#cbd5e1',
  'color/gray/400': '#94a3b8',
  'color/gray/500': '#64748b',
  'color/gray/600': '#475569',
  'color/gray/700': '#334155',
  'color/gray/800': '#1e293b',
  'color/gray/900': '#0f172a',
  // green (50–900)
  'color/green/50':  '#f0fdf4',
  'color/green/100': '#dcfce7',
  'color/green/200': '#bbf7d0',
  'color/green/300': '#86efac',
  'color/green/400': '#4ade80',
  'color/green/500': '#22c55e',
  'color/green/600': '#16a34a',
  'color/green/700': '#15803d',
  'color/green/800': '#166534',
  'color/green/900': '#14532d',
  // orange (50–900)
  'color/orange/50':  '#fffbeb',
  'color/orange/100': '#fef3c7',
  'color/orange/200': '#fde68a',
  'color/orange/300': '#fcd34d',
  'color/orange/400': '#fbbf24',
  'color/orange/500': '#f59e0b',
  'color/orange/600': '#d97706',
  'color/orange/700': '#b45309',
  'color/orange/800': '#92400e',
  'color/orange/900': '#78350f',
  // red (50–900)
  'color/red/50':  '#fff1f2',
  'color/red/100': '#ffe4e6',
  'color/red/200': '#fecdd3',
  'color/red/300': '#fca5a5',
  'color/red/400': '#f87171',
  'color/red/500': '#ef4444',
  'color/red/600': '#dc2626',
  'color/red/700': '#b91c1c',
  'color/red/800': '#991b1b',
  'color/red/900': '#7f1d1d',
  // turquoise (50–900)
  'color/turquoise/50':  '#f0f9ff',
  'color/turquoise/100': '#e0f2fe',
  'color/turquoise/200': '#bae6fd',
  'color/turquoise/300': '#7dd3fc',
  'color/turquoise/400': '#38bdf8',
  'color/turquoise/500': '#0ea5e9',
  'color/turquoise/600': '#0284c7',
  'color/turquoise/700': '#0369a1',
  'color/turquoise/800': '#075985',
  'color/turquoise/900': '#0c4a6e',
};

for (const [name, hex] of Object.entries(primitiveColors)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === primColl.id);
  const v = existing || figma.variables.createVariable(name, primColl, 'COLOR');
  v.scopes = [];
  v.setValueForMode(modeId, hexToRgb(hex));
}

return { created: Object.keys(primitiveColors).length };
```

---

### Phase 2 — Semantic color variables (→ `Theme`) with light / dark modes

```js
const themeColl = getOrCreateCollection('Theme');
let lightModeId, darkModeId;
if (themeColl.modes.length === 1) {
  themeColl.renameMode(themeColl.modes[0].modeId, 'light');
  const newMode = themeColl.addMode('dark');
  lightModeId = themeColl.modes[0].modeId;
  darkModeId = newMode;
} else {
  lightModeId = themeColl.modes.find(m => m.name === 'light')?.modeId || themeColl.modes[0].modeId;
  darkModeId  = themeColl.modes.find(m => m.name === 'dark')?.modeId  || themeColl.modes[1].modeId;
}

const varMap = buildVarMap();

// Correct scope enum values (Figma Plugin API)
const SCOPES = ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'];

// [lightPrimitive, darkPrimitive] — both refer to Primitives collection variable names
// Keys use '/' for every grammar segment (role/interactive/modifier/state), not '-' —
// see "Naming rules" above. tokens.json itself still uses flat hyphenated keys; only the
// Figma variable name translates each segment into its own path level.
const semanticColors = {
  // fill — surface
  'fill/page':               ['color/gray/0',   'color/gray/900'],
  'fill/surface':            ['color/gray/50',  'color/gray/800'],
  'fill/surface/dark':       ['color/gray/100', 'color/gray/700'],
  'fill/overlay':            ['color/gray/900', 'color/gray/900'],
  'fill/disabled':           ['color/gray/100', 'color/gray/800'],
  // fill — secondary (interactive: has hover + press states)
  'fill/secondary/interactive/default': ['color/gray/100', 'color/gray/800'],
  'fill/secondary/interactive/hover':   ['color/gray/200', 'color/gray/700'],
  'fill/secondary/interactive/press':   ['color/gray/300', 'color/gray/600'],
  // fill — primary (interactive)
  'fill/primary/interactive/default':      ['color/blue/600', 'color/blue/600'],
  'fill/primary/interactive/hover':        ['color/blue/700', 'color/blue/700'],
  'fill/primary/interactive/press':        ['color/blue/800', 'color/blue/800'],
  'fill/primary/interactive/light/default': ['color/blue/50',  'color/blue/900'],
  'fill/primary/interactive/light/hover':  ['color/blue/100','color/blue/800'],
  // fill — status (interactive)
  'fill/danger/interactive/default':      ['color/red/600',  'color/red/600'],
  'fill/danger/interactive/hover':        ['color/red/700',  'color/red/700'],
  'fill/danger/interactive/press':        ['color/red/800',  'color/red/800'],
  'fill/danger/interactive/light/default': ['color/red/50',   'color/red/900'],
  'fill/danger/interactive/light/hover':  ['color/red/100',  'color/red/800'],
  'fill/success/interactive/default':     ['color/green/600', 'color/green/600'],
  'fill/success/interactive/hover':       ['color/green/700', 'color/green/700'],
  'fill/success/light':      ['color/green/50',  'color/green/900'],
  'fill/warning/interactive/default':     ['color/orange/600', 'color/orange/600'],
  'fill/warning/interactive/hover':       ['color/orange/700', 'color/orange/700'],
  'fill/warning/light':      ['color/orange/50',  'color/orange/900'],
  'fill/info/interactive/default':        ['color/turquoise/600',    'color/turquoise/600'],
  'fill/info/interactive/hover':          ['color/turquoise/700',    'color/turquoise/700'],
  'fill/info/light':         ['color/turquoise/50',     'color/turquoise/900'],
  // text
  'text/neutral':            ['color/gray/900', 'color/gray/100'],
  'text/neutral/light':      ['color/gray/600', 'color/gray/400'],
  'text/neutral/lightest':   ['color/gray/500', 'color/gray/500'],
  'text/disabled':           ['color/gray/400', 'color/gray/600'],
  'text/inverse':            ['color/gray/0',   'color/gray/900'],
  'text/primary':            ['color/blue/600','color/blue/400'],
  'text/link':               ['color/blue/600','color/blue/400'],
  'text/link/hover':         ['color/blue/700','color/blue/300'],
  'text/danger':             ['color/red/600', 'color/red/400'],
  'text/success':            ['color/green/700','color/green/500'],
  'text/warning':            ['color/orange/700','color/orange/500'],
  'text/info':               ['color/turquoise/700',   'color/turquoise/500'],
  // icon — mirrors text role-for-role, bound independently (see packages/tokens/CLAUDE.md)
  'icon/neutral':            ['color/gray/900', 'color/gray/100'],
  'icon/neutral/light':      ['color/gray/600', 'color/gray/400'],
  'icon/neutral/lightest':   ['color/gray/500', 'color/gray/500'],
  'icon/disabled':           ['color/gray/400', 'color/gray/600'],
  'icon/inverse':            ['color/gray/0',   'color/gray/900'],
  'icon/primary':            ['color/blue/600','color/blue/400'],
  'icon/danger':             ['color/red/600', 'color/red/400'],
  'icon/success':            ['color/green/700','color/green/500'],
  'icon/warning':            ['color/orange/700','color/orange/500'],
  'icon/info':               ['color/turquoise/700',   'color/turquoise/500'],
  // border
  'border/neutral':          ['color/gray/200', 'color/gray/700'],
  'border/neutral/dark':     ['color/gray/400', 'color/gray/600'],
  'border/neutral/light':    ['color/gray/100', 'color/gray/800'],
  'border/focus':            ['color/blue/500','color/blue/500'],
  'border/danger':           ['color/red/500', 'color/red/500'],
  'border/success':          ['color/green/500','color/green/500'],
  'border/warning':          ['color/orange/400','color/orange/400'],
  'border/info':             ['color/turquoise/200', 'color/turquoise/200'],
  'border/inverse':          ['color/gray/700', 'color/gray/400'],
};

for (const [semName, [lightPrim, darkPrim]] of Object.entries(semanticColors)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === semName && v.variableCollectionId === themeColl.id);
  const v = existing || figma.variables.createVariable(semName, themeColl, 'COLOR');
  v.scopes = SCOPES;
  const lightVar = varMap[lightPrim];
  const darkVar  = varMap[darkPrim];
  if (lightVar) v.setValueForMode(lightModeId, figma.variables.createVariableAlias(lightVar));
  if (darkVar)  v.setValueForMode(darkModeId,  figma.variables.createVariableAlias(darkVar));
}

return { created: Object.keys(semanticColors).length };
```

---

### Phase 3 — Spacing primitive variables (→ `Primitives`)

Source: `primitive.spacing.*` — a **percentage scale**, not raw step numbers. `spacing/100` is the anchor
(`16px` = `1rem`); every other rung is a percentage of it. Dots are invalid in Figma variable names — use
hyphens: `spacing/12-5`, `spacing/37-5`, etc.

```js
const primColl = getOrCreateCollection('Primitives');
const sModeId = primColl.modes.find(m => m.name === 'default').modeId;

const spacingTokens = {
  'spacing/0': 0,     'spacing/12-5': 2,  'spacing/25': 4,   'spacing/37-5': 6,
  'spacing/50': 8,    'spacing/62-5': 10, 'spacing/75': 12,  'spacing/87-5': 14,
  'spacing/100': 16,  'spacing/125': 20,  'spacing/150': 24, 'spacing/175': 28,
  'spacing/200': 32,  'spacing/250': 40,  'spacing/300': 48, 'spacing/350': 56,
  'spacing/400': 64,  'spacing/500': 80,  'spacing/600': 96, 'spacing/800': 128,
};

for (const [name, px] of Object.entries(spacingTokens)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === primColl.id);
  const v = existing || figma.variables.createVariable(name, primColl, 'FLOAT');
  v.scopes = ['WIDTH_HEIGHT', 'GAP'];
  v.setValueForMode(sModeId, px);
}

return { created: Object.keys(spacingTokens).length };
```

---

### Phase 3b — Semantic spacing variables (→ `Semantic`)

Source: `semantic.spacing.{xs,s,m,l,xl}` — a t-shirt scale aliasing the `Primitives` spacing values above.
No `component.*` token points at this yet (see `packages/tokens/CLAUDE.md`), but it belongs in Figma
regardless so designers have the same vocabulary as the token file. Prefixed `spacing/*` since `Semantic`
also holds `radius/*` and `size/*` — a bare `m` would be ambiguous between the three.

```js
const semColl = getOrCreateCollection('Semantic');
const semModeId = semColl.modes.find(m => m.name === 'default')?.modeId || semColl.modes[0].modeId;

const primColl = getOrCreateCollection('Primitives');
const spacingPrimMap = {};
figma.variables.getLocalVariables()
  .filter(v => v.variableCollectionId === primColl.id)
  .forEach(v => { spacingPrimMap[v.name] = v; });

const spacingSemantic = { 'spacing/xs': 'spacing/50', 'spacing/s': 'spacing/75', 'spacing/m': 'spacing/100', 'spacing/l': 'spacing/150', 'spacing/xl': 'spacing/200' };

for (const [name, primName] of Object.entries(spacingSemantic)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === semColl.id);
  const v = existing || figma.variables.createVariable(name, semColl, 'FLOAT');
  v.scopes = ['WIDTH_HEIGHT', 'GAP'];
  v.setValueForMode(semModeId, figma.variables.createVariableAlias(spacingPrimMap[primName]));
}

return { created: Object.keys(spacingSemantic).length };
```

---

### Phase 4 — Semantic radius variables (→ `Semantic`)

**No primitive layer for radius** — `semantic.radius.*` is the only tier, there's no smaller unit to derive
a radius scale from. Values are direct, not aliases.

```js
const semColl = getOrCreateCollection('Semantic');
const semModeId = semColl.modes.find(m => m.name === 'default')?.modeId || semColl.modes[0].modeId;

const radiusTokens = {
  'radius/none': 0, 'radius/xs': 2, 'radius/s': 4, 'radius/m': 6, 'radius/l': 8,
  'radius/xl': 12,  'radius/2xl': 16, 'radius/3xl': 24, 'radius/full': 9999,
};

for (const [name, px] of Object.entries(radiusTokens)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === semColl.id);
  const v = existing || figma.variables.createVariable(name, semColl, 'FLOAT');
  v.scopes = ['CORNER_RADIUS'];
  v.setValueForMode(semModeId, px);
}

return { created: Object.keys(radiusTokens).length };
```

---

### Phase 4b — Size primitive variables (→ `Primitives`)

Source: `primitive.size.*` — a **percentage scale**, same `100` = `16px` anchor as spacing, kept as its own
prefix (`size/*` vs `spacing/*`) because "a control's own dimension" and "the gap around it" are different
concerns even where the numbers coincide.

```js
const primColl = getOrCreateCollection('Primitives');
const modeId = primColl.modes.find(m => m.name === 'default').modeId;

const sizingTokens = {
  'size/50': 8,   'size/75': 12,  'size/100': 16, 'size/125': 20, 'size/150': 24, 'size/175': 28,
  'size/200': 32, 'size/225': 36, 'size/250': 40, 'size/300': 48, 'size/350': 56,
};

for (const [name, px] of Object.entries(sizingTokens)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === primColl.id);
  const v = existing || figma.variables.createVariable(name, primColl, 'FLOAT');
  v.scopes = ['WIDTH_HEIGHT'];
  v.setValueForMode(modeId, px);
}

return { created: Object.keys(sizingTokens).length };
```

---

### Phase 4c — Semantic size variables (→ `Semantic`)

Source: `semantic.size.control.{xs,s,m,l,xl}` — ADR-004's control/field ladder, aliasing the `Primitives`
size values above. Figma name uses the `tokens.json` category (`size`), not the sub-key (`control`) — stays
parallel with `radius/*` and `spacing/*`, the other two scales sharing this collection; there's only one
sub-scale under `semantic.size` today, so `size/*` alone isn't ambiguous. **Components must bind height
here, never straight to a `Primitives` size value** — matches how component colors bind to `Theme`, never
to a `Primitives` color directly.

```js
const semColl = getOrCreateCollection('Semantic');
const semModeId = semColl.modes.find(m => m.name === 'default')?.modeId || semColl.modes[0].modeId;

const primColl = getOrCreateCollection('Primitives');
const sizingPrimMap = {};
figma.variables.getLocalVariables()
  .filter(v => v.variableCollectionId === primColl.id)
  .forEach(v => { sizingPrimMap[v.name] = v; });

const controlSemantic = { 'size/xs': 'size/100', 'size/s': 'size/150', 'size/m': 'size/200', 'size/l': 'size/250', 'size/xl': 'size/300' };

for (const [name, primName] of Object.entries(controlSemantic)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === semColl.id);
  const v = existing || figma.variables.createVariable(name, semColl, 'FLOAT');
  v.scopes = ['WIDTH_HEIGHT'];
  v.setValueForMode(semModeId, figma.variables.createVariableAlias(sizingPrimMap[primName]));
}

return { created: Object.keys(controlSemantic).length };
```

---

### Phase 5 — Typography primitive variables (→ `Primitives`)

Includes fontSize, fontWeight, lineHeight (FLOAT) AND fontFamily (STRING).

```js
const primColl = getOrCreateCollection('Primitives');
const modeId = primColl.modes.find(m => m.name === 'default').modeId;

// FLOAT vars
const typographyTokens = [
  ['fontSize/xs',  11,  ['FONT_SIZE']],
  ['fontSize/s',   13,  ['FONT_SIZE']],
  ['fontSize/m',   15,  ['FONT_SIZE']],
  ['fontSize/l',   17,  ['FONT_SIZE']],
  ['fontSize/xl',  20,  ['FONT_SIZE']],
  ['fontSize/2xl', 24,  ['FONT_SIZE']],
  ['fontSize/3xl', 30,  ['FONT_SIZE']],
  ['fontSize/4xl', 36,  ['FONT_SIZE']],
  ['fontSize/5xl', 48,  ['FONT_SIZE']],
  ['fontWeight/regular',  400, ['FONT_WEIGHT']],
  ['fontWeight/medium',   500, ['FONT_WEIGHT']],
  ['fontWeight/semibold', 600, ['FONT_WEIGHT']],
  ['fontWeight/bold',     700, ['FONT_WEIGHT']],
  ['lineHeight/tight',   120,  ['LINE_HEIGHT']],
  ['lineHeight/snug',    135,  ['LINE_HEIGHT']],
  ['lineHeight/normal',  150,  ['LINE_HEIGHT']],
  ['lineHeight/relaxed', 165,  ['LINE_HEIGHT']],
];

for (const [name, val, scopes] of typographyTokens) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === primColl.id);
  const v = existing || figma.variables.createVariable(name, primColl, 'FLOAT');
  v.scopes = scopes;
  v.setValueForMode(modeId, val);
}

// STRING vars (fontFamily) — same collection
const fontFamilies = {
  'fontFamily/sans': 'Inter, ui-sans-serif, system-ui, sans-serif',
  'fontFamily/mono': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};
for (const [name, value] of Object.entries(fontFamilies)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === primColl.id);
  const v = existing || figma.variables.createVariable(name, primColl, 'STRING');
  v.scopes = ['FONT_FAMILY'];
  v.setValueForMode(modeId, value);
}

return { floatVars: typographyTokens.length, stringVars: Object.keys(fontFamilies).length };
```

---

### Phase 6 — Text Styles

Named `{role} / {weight}` — no system prefix. Inter font. Color NOT part of the style.

```js
async function createTextStyles() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  // [name, family, style, size, lineH%, letterSpacing%]
  const textStyleDefs = [
    ['Caption / Regular',       'Inter', 'Regular',   11, 150,  0],
    ['Caption / Semibold',      'Inter', 'Semi Bold', 11, 150, 10],
    ['Body / s / Regular',      'Inter', 'Regular',   13, 150,  0],
    ['Body / s / Medium',       'Inter', 'Medium',    13, 150,  0],
    ['Body / m / Regular',      'Inter', 'Regular',   15, 150,  0],
    ['Body / m / Medium',       'Inter', 'Medium',    15, 150,  0],
    ['Body / l / Regular',      'Inter', 'Regular',   17, 165,  0],
    ['Body / l / Medium',       'Inter', 'Medium',    17, 165,  0],
    ['Heading / xl / Semibold', 'Inter', 'Semi Bold', 20, 135,  0],
    ['Heading / 2xl / Semibold','Inter', 'Semi Bold', 24, 135,  0],
    ['Heading / 3xl / Semibold','Inter', 'Semi Bold', 30, 120, -3],
    ['Heading / 4xl / Bold',    'Inter', 'Bold',      36, 120, -3],
    ['Display / 5xl / Bold',    'Inter', 'Bold',      48, 120, -3],
    ['Label / Uppercase',       'Inter', 'Semi Bold', 11, 150, 10],
    ['Code / Regular',          'Inter', 'Regular',   13, 150,  0],
  ];

  const existing = {};
  figma.getLocalTextStyles().forEach(s => { existing[s.name] = s; });

  for (const [name, family, style, size, lineHPct, letterPct] of textStyleDefs) {
    const ts = existing[name] || figma.createTextStyle();
    ts.name = name;
    ts.fontName = { family, style };
    ts.fontSize = size;
    ts.lineHeight = { unit: 'PERCENT', value: lineHPct };
    ts.letterSpacing = { unit: 'PERCENT', value: letterPct };
  }
}

await createTextStyles();
return { textStyles: figma.getLocalTextStyles().length };
```

**Inter font style note:** use `'Semi Bold'` (with space), NOT `'SemiBold'`. Verify with `await figma.listAvailableFontsAsync()` if in doubt.

---

### Phase 7 — Responsive typography (→ `Responsive`)

Source: `primitive.breakpoint.{mobile,tablet,desktop}` (0/768/1024px) + `primitive.fontSize.*` (desktop/
tablet — unchanged) + `semantic.fontSize.mobile.*` (87.5% of desktop, ADR-backed). Only `fontSize` scales
by breakpoint; `lineHeight`/`letterSpacing` don't change. `tablet` and `desktop` modes hold identical values
since typography doesn't differ between them — only `mobile` actually diverges. This is the Figma-side
mirror of the `@media (max-width: 767px)` block `build.ts` emits from the same source tokens. **Caveat:**
the CSS override only reaches `--helix-primitive-fontSize-*` — component-level fontSize vars (e.g.
`--helix-button-fontSize-m`) inline their resolved value at build time rather than referencing the
primitive via `var()`, so they don't pick up the responsive override yet. That's a known limitation of the
current build pipeline (inlining, not var-chaining), not something this Figma collection can fix on its
own — Figma variable bindings on text nodes are a separate, correctly-cascading mechanism (bind a text
node's `fontSize` to this collection's variable and Figma's own mode-switching handles it).

```js
const respColl = getOrCreateCollection('Responsive');
let mobileModeId, tabletModeId, desktopModeId;
if (respColl.modes.length === 1) {
  respColl.renameMode(respColl.modes[0].modeId, 'mobile');
  mobileModeId = respColl.modes[0].modeId;
  tabletModeId = respColl.addMode('tablet');
  desktopModeId = respColl.addMode('desktop');
} else {
  mobileModeId  = respColl.modes.find(m => m.name === 'mobile')?.modeId  || respColl.modes[0].modeId;
  tabletModeId  = respColl.modes.find(m => m.name === 'tablet')?.modeId  || respColl.modes[1].modeId;
  desktopModeId = respColl.modes.find(m => m.name === 'desktop')?.modeId || respColl.modes[2].modeId;
}

// desktop values = primitive.fontSize.* (unchanged); tablet shares the same values as desktop
const desktopFontSize = { xs: 11, s: 13, m: 15, l: 17, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48 };
const mobileFontSize  = { xs: 10, s: 11, m: 13, l: 15, xl: 18, '2xl': 21, '3xl': 26, '4xl': 32, '5xl': 42 };

const created = [];
for (const key of Object.keys(desktopFontSize)) {
  const name = `fontSize/${key}`;
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === respColl.id);
  const v = existing || figma.variables.createVariable(name, respColl, 'FLOAT');
  v.scopes = ['FONT_SIZE'];
  v.setValueForMode(mobileModeId, mobileFontSize[key]);
  v.setValueForMode(tabletModeId, desktopFontSize[key]);
  v.setValueForMode(desktopModeId, desktopFontSize[key]);
  created.push(name);
}

return { created, modes: respColl.modes.map(m => m.name) };
```

---

### Phase 8 — Effect Styles (Shadows)

Named `shadow / {scale}` — no system prefix.

```js
const shadowDefs = [
  ['shadow / xs',   [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.05}, offset:{x:0,y:1}, radius:2, spread:0, visible:true, blendMode:'NORMAL' }]],
  ['shadow / s',    [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.08}, offset:{x:0,y:1}, radius:3, spread:0, visible:true, blendMode:'NORMAL' },
                     { type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.04}, offset:{x:0,y:1}, radius:2, spread:0, visible:true, blendMode:'NORMAL' }]],
  ['shadow / m',    [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.07}, offset:{x:0,y:4}, radius:6, spread:0, visible:true, blendMode:'NORMAL' },
                     { type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.05}, offset:{x:0,y:2}, radius:4, spread:0, visible:true, blendMode:'NORMAL' }]],
  ['shadow / l',    [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.08}, offset:{x:0,y:10},radius:15,spread:0, visible:true, blendMode:'NORMAL' },
                     { type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.04}, offset:{x:0,y:4}, radius:6, spread:0, visible:true, blendMode:'NORMAL' }]],
  ['shadow / xl',   [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.10}, offset:{x:0,y:20},radius:25,spread:0, visible:true, blendMode:'NORMAL' },
                     { type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.04}, offset:{x:0,y:10},radius:10,spread:0, visible:true, blendMode:'NORMAL' }]],
  ['shadow / focus',[{ type:'DROP_SHADOW', color:{r:0.145,g:0.388,b:0.922,a:0.25}, offset:{x:0,y:0}, radius:0, spread:3, visible:true, blendMode:'NORMAL' }]],
];

const existing = {};
figma.getLocalEffectStyles().forEach(s => { existing[s.name] = s; });

for (const [name, effects] of shadowDefs) {
  const es = existing[name] || figma.createEffectStyle();
  es.name = name;
  es.effects = effects;
}

return { effectStyles: figma.getLocalEffectStyles().length };
```

---

### Phase 9 — QA

```js
const cols = figma.variables.getLocalVariableCollections();
const allVars = figma.variables.getLocalVariables();
const result = {};
cols.forEach(c => {
  const count = allVars.filter(v => v.variableCollectionId === c.id).length;
  const modes = c.modes.map(m => m.name).join(', ');
  result[c.name] = { count, modes };
});
result['textStyles'] = figma.getLocalTextStyles().length;
result['effectStyles'] = figma.getLocalEffectStyles().length;
return result;
```

---

### Entry C — single token addition (per `pnpm token:add` run)

When `scripts/token-cli.ts` has already added ONE token to `src/tokens.json` (naming-checked and
built locally), don't re-run Phases 1–9 — push just that one variable. Only `semantic.*` and
`component.*` tokens live in Figma variables as a rule of thumb; a `primitive.*` addition needs the
`Primitives` collection to already exist first (rare — most new work is a semantic alias onto existing
primitives).

1. Get the new token's path and value out of `packages/tokens/dist/helix.css` (already built) —
   e.g. `semantic.color.icon.neutral-darkest` → CSS var `--helix-color-icon-neutral-darkest` →
   Figma variable name `icon/neutral/darkest` in the `Theme` collection. Figma name = the
   token's own hyphenated key (`neutral-darkest`) with **every** `-` turned into `/` (each grammar
   segment — role/interactive/modifier/state — becomes its own path level; see "Naming rules" above)
   — same mapping the `semanticColors` table in Phase 2 uses.
2. Resolve which **primitive** it aliases (light mode) and its dark-mode counterpart, the same way
   every row in the Phase 2 `semanticColors` table does — read the token's `$value` alias in
   `tokens.json` for light, and the matching key in `src/build.ts`'s `darkOverrides` map for dark.
3. Run one `use_figma` call:

```js
await figma.setCurrentPageAsync(figma.root.children[0]); // variables aren't page-scoped, any page works
const themeColl = figma.variables.getLocalVariableCollections().find(c => c.name === 'Theme');
const lightModeId = themeColl.modes.find(m => m.name === 'light').modeId;
const darkModeId  = themeColl.modes.find(m => m.name === 'dark').modeId;
const varMap = {};
figma.variables.getLocalVariables().forEach(v => { varMap[v.name] = v; });

const name = 'icon/neutral/darkest';           // ← the new/renamed variable
const lightPrimitive = 'color/gray/900';       // ← what it resolves to in light mode
const darkPrimitive  = 'color/gray/100';       // ← what it resolves to in dark mode

const existing = figma.variables.getLocalVariables()
  .find(v => v.name === name && v.variableCollectionId === themeColl.id);
const v = existing || figma.variables.createVariable(name, themeColl, 'COLOR');
v.scopes = ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'];
if (varMap[lightPrimitive]) v.setValueForMode(lightModeId, figma.variables.createVariableAlias(varMap[lightPrimitive]));
if (varMap[darkPrimitive])  v.setValueForMode(darkModeId,  figma.variables.createVariableAlias(varMap[darkPrimitive]));

return { createdOrUpdated: name };
```

4. **Renaming an existing token** (not adding): find the variable by its OLD name, set `.name` to
   the new one — do NOT create a second variable, or every component instance bound to the old
   variable silently keeps pointing at an orphaned one.
5. Re-run Phase 9 (QA) to confirm the `Theme` count moved by exactly the number of tokens
   you added (0 for a pure rename).

---

## Output

4 Figma variable collections (`Primitives`, `Theme`, `Semantic`, `Responsive`), plus Text Styles and
Effect Styles, all named to match `packages/tokens/src/tokens.json` with no system prefix — ready for
`components-to-figma` to bind against.

## Regression checklist

Run Phase 9 and confirm the counts match:

- [ ] `Primitives`: 111 vars, modes=[default] — 61 color (10 blue + 11 gray + 10 each
      green/orange/red/turquoise) + 20 spacing + 11 size + 19 typography
- [ ] `Theme`: 58 vars, modes=[light, dark] (`fill/*` 27, `text/*` 12, `icon/*` 10, `border/*` 9 — no
      `color/` prefix)
- [ ] No `Theme` variable name contains a `-` — every grammar segment (role/interactive/
      modifier/state) is its own `/`-delimited path level (`fill/primary/interactive/light/hover`,
      not `fill/primary-interactive-light-hover`)
- [ ] `Semantic`: 19 vars, modes=[default] — 9 `radius/*` + 5 `size/*` + 5 `spacing/*`
- [ ] `Responsive`: 9 vars, modes=[mobile, tablet, desktop] (`fontSize/xs`...`fontSize/5xl`) — `tablet` and
      `desktop` mode values are identical to each other, only `mobile` differs
- [ ] No collection or style name has a system prefix (`Helix / ...`)
- [ ] Dot-containing token names were converted to hyphens (e.g. `spacing/12-5`, not `spacing/12.5`)
- [ ] Exactly 4 variable collections total (`Primitives`, `Theme`, `Semantic`, `Responsive`) — never a 5th
      ad-hoc collection for a single category

---

## Common API errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `FONT_WEIGHT` is not a valid scope | Wrong enum | Use `'FONT_WEIGHT'` exactly; check Plugin API types |
| `COLOR_FILLS` invalid | Wrong scope enum | Use `'ALL_FILLS'`, `'STROKE_COLOR'`, `'EFFECT_COLOR'` |
| Invalid variable name with `.` | Dot not allowed | Replace `.` with `-` in Figma names: `spacing/12-5` |
| Font style `SemiBold` not found | Missing space | Inter uses `'Semi Bold'` (two words) |
| `setBoundVariableForPaint` ignored | Return value dropped | Capture return and reassign: `node.fills = [newPaint]` |
| Alias loop | `Primitives` not created first | Always run Phase 1/3/4b/5 (whichever primitive category) before the matching semantic phase |
| Mode limit | Free plan allows 1 mode | Requires Figma Professional or higher |
| `setBoundVariable` on a TEXT property silently no-ops | Font not loaded on that node first | Load every distinct font on the text node via `getStyledTextSegments(['fontName'])` + `loadFontAsync` before `setBoundVariable` |
| `boundVariables.fontSize` (or other TEXT fields) is an array, not a single alias | TEXT nodes represent bound properties per styled segment | Read `boundVariables.fontSize[0].id`, not `boundVariables.fontSize.id` |
