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

Everything lives in exactly 4 variable collections, one per role — **not** one per `tokens.json` category,
and **there is no `Component` collection** — `component.*` tokens live only in code
(`packages/tokens/src/tokens.json`), never mirrored into Figma. A Figma component (Button, Badge, ...)
binds directly to whichever of these 4 collections its underlying `component.*` token aliases in code —
see "Naming rules" below and `components-to-figma.md` for how to resolve which one that is.

| Collection | Holds | Modes |
|------------|-------|-------|
| `Primitives` | `primitive.color.*`, `primitive.spacing.*`, `primitive.size.*`, `primitive.fontSize/fontWeight/lineHeight/fontFamily.*`, `primitive.breakpoint.*` | `default` |
| `Theme` | `semantic.color.*` (`fill`/`text`/`icon`/`border`) | `light`, `dark` |
| `Semantic` | `semantic.radius.*`, `semantic.size.control.*`, `semantic.spacing.*`, `semantic.fontSize.mobile.*` (`primitive.fontSize >= 18px` only), `semantic.lineHeight.*` (full `xs`-`6xl` range — Text Styles need every size, see Phase 6) | `default` |
| `Responsive` | Per-breakpoint typography for `primitive.fontSize >= 18px` only (`fontSize` and `lineHeight`) — smaller text doesn't get a mobile override | `mobile`, `tablet`, `desktop` |

**Why this shape:** primitives are raw, component-agnostic scales — one bucket regardless of what kind of
value. `Theme` is the one collection designers actually switch modes on (light/dark), so it stays alone.
`Semantic` is everything else with role-based meaning but no light/dark split. `Responsive` is the only
collection where the *mode* itself represents something other than a color theme.

**Typography rule:** a `fontSize`/`lineHeight` binding on a live Figma node must reference `Responsive`
when the resolved `primitive.fontSize` is `>= 18px`, and `Primitives` directly below that — see Phase 7.
Figma Text Styles are the one exception, always binding to `Primitives` regardless of size — see Phase 6.
`fontFamily` and `fontWeight` don't vary by breakpoint at any size, so they always reference `Primitives`
directly.

Within `Primitives` and `Semantic`, variable names still carry a category prefix (`color/`, `spacing/`,
`size/`, `fontSize/`, `radius/`) so the picker stays organized despite sharing one collection — see
"Naming rules" below.

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

**Spacing/size primitive keys are whole-number percentages only** — no fractional rungs
(`primitive.spacing`/`primitive.size` were pruned to drop the sub-8px steps that produced fractional
percentages like `12.5`/`37.5`, since nothing referenced them; `size` never had any). If a future addition
ever needs a fractional percentage, the naming rule is: dots are invalid in Figma variable names, use a
hyphen instead (`spacing/0.5` → `spacing/0-5`) — not currently needed for anything live.

**Always create t-shirt-scale variables smallest → largest**, in that order, in every `createVariable`
loop (`xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl`...). Figma's variable panel lists a collection's variables in
creation order, not alphabetically or numerically — creating them out of order leaves the picker jumbled
for anyone browsing it by hand. This applies to every t-shirt-scaled category: `fontSize`, `lineHeight`,
`radius`, `size` (both `Primitives` and `Semantic`), `spacing`'s t-shirt alias. Verified compliant as of
this writing — keep it that way on every future addition.

**In `Theme`, every grammar segment joins with `/`, not `-`.** A semantic color token's key in
`tokens.json` is a flat hyphenated string — `fill.primary-interactive-light-hover` — per the
`{role}[-interactive][-modifier][-state]` grammar in `packages/tokens/CLAUDE.md`. In Figma, translate each
of those segments into its own `/`-delimited path level instead, so Figma groups them as nested folders in
the variable picker: `fill/primary/interactive/light/hover`, not `fill/primary-interactive-light-hover`.
This is **Figma-only** — `tokens.json` keys and the generated `--helix-*` CSS custom properties keep `-`
throughout (CSS doesn't allow `/` in an identifier), so the CSS var name for that same token stays
`--helix-color-fill-primary-interactive-light-hover`. If a future fractional spacing/size percentage ever
exists again, its decimal hyphen would stay as one segment, not split into `/` (e.g. a hypothetical
`spacing/12-5` is one rung, not `spacing/12/5`) — that `-` would encode a decimal point, not a grammar
segment.

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
| Semantic mobile fontSize | `semantic.fontSize.mobile.*` | `Semantic` | `fontSize/mobile/*` |
| Semantic lineHeight | `semantic.lineHeight.*` (paired per fontSize rung) | `Semantic` | `lineHeight/{size}` |
| Responsive typography | per-breakpoint `fontSize` + `lineHeight` | `Responsive` | `fontSize/*`, `lineHeight/*` — 3 modes: mobile / tablet / desktop |
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
(`16px` = `1rem`); every other rung is a whole-number percentage of it — no fractional rungs (the sub-8px
steps that would've produced `12.5`/`37.5`/etc. were pruned since nothing referenced them; keep it that way,
same round-numbers-only pattern as `Sizing`).

```js
const primColl = getOrCreateCollection('Primitives');
const sModeId = primColl.modes.find(m => m.name === 'default').modeId;

const spacingTokens = {
  'spacing/0': 0,     'spacing/25': 4,    'spacing/50': 8,    'spacing/75': 12,
  'spacing/100': 16,  'spacing/125': 20,  'spacing/150': 24,  'spacing/175': 28,
  'spacing/200': 32,  'spacing/250': 40,  'spacing/300': 48,  'spacing/350': 56,
  'spacing/400': 64,  'spacing/500': 80,  'spacing/600': 96,  'spacing/800': 128,
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
  ['fontSize/s',   12,  ['FONT_SIZE']],
  ['fontSize/m',   14,  ['FONT_SIZE']],
  ['fontSize/l',   20,  ['FONT_SIZE']],
  ['fontSize/xl',  24,  ['FONT_SIZE']],
  ['fontSize/2xl', 32,  ['FONT_SIZE']],
  ['fontSize/3xl', 40,  ['FONT_SIZE']],
  ['fontSize/4xl', 48,  ['FONT_SIZE']],
  ['fontSize/5xl', 56,  ['FONT_SIZE']],
  ['fontSize/6xl', 64,  ['FONT_SIZE']],
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

// STRING vars (fontFamily) — same collection. Figma-side values are the single, real, loadable font
// name — NOT tokens.json's CSS fallback stack ("Inter, ui-sans-serif, system-ui, sans-serif"). A
// TextStyle.setBoundVariable('fontFamily', v) call tries to load whatever string `v` holds as one font
// name; the CSS fallback list isn't a real font and fails to load (and partially corrupts fontName.family
// before throwing — fix with a manual `ts.fontName = {family, style}` reset if this happens). This is a
// deliberate representation difference from the JSON/CSS value, same precedent as lineHeight below.
const fontFamilies = {
  'fontFamily/sans': 'Inter',
  'fontFamily/mono': 'SFMono-Regular',
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

**Bind `fontSize`, `fontFamily`, and `fontWeight` to `Primitives` — leave `lineHeight` as a literal
PERCENT value.** All 4 typography properties should trace back to a token; 3 of the 4 can actually be
bound as Figma Variables, one can't, for a real platform reason each:

- **`fontSize`** → `Primitives.fontSize/{key}` for every style, never `Responsive`, regardless of the 18px
  threshold that applies elsewhere (see Phase 7). A `TextStyle` has no way to pin which mode of a
  multi-mode collection it reads — bind its `fontSize` to a `Responsive` variable and Figma silently uses
  whichever mode is first in that collection's mode list (`mobile`, in this file), not the desktop/reference
  size a Text Style is supposed to show. Binding straight to `Primitives` sidesteps the ambiguity entirely
  since `Primitives` only has one mode.
- **`fontFamily`** → `Primitives.fontFamily/sans`. This variable's Figma-side value is `'Inter'` — a single,
  real, loadable font name — NOT `tokens.json`'s CSS fallback stack (`"Inter, ui-sans-serif, system-ui,
  sans-serif"`). Binding to a variable holding the full CSS string throws `unloaded font "Inter,
  ui-sans-serif..."` and can partially corrupt `fontName.family` before it throws — if that happens, reset
  with a plain `ts.fontName = {family, style}` first. See Phase 5's note on why the Figma value diverges
  from the JSON value here.
- **`fontWeight`** → `Primitives.fontWeight/{regular,medium,semibold,bold}`, matched to the style's
  `fontName.style` (`'Regular'`→`fontWeight/regular`, `'Semi Bold'`→`fontWeight/semibold`, etc.). Works
  as a normal bind — no gotcha here.
- **`lineHeight`** → stays a literal PERCENT value, never bound. `semantic.lineHeight.*` stores a unitless
  ratio (`1.5`, `1.65`, etc., mirroring `primitive.lineHeight.*`). Binding a `TextStyle`'s `lineHeight` to
  that variable makes Figma read the raw number as **pixels**, not a ratio or percent —
  `ts.setBoundVariable('lineHeight', v)` where `v` resolves to `150` produces `150px` of line height on a
  12px-14px body font, which is wildly wrong. Compute the percent yourself (`ratio * 100`) and set it as a
  literal (`{unit: 'PERCENT', value: ratio * 100}`) instead.

```js
async function createTextStyles() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const primColl = figma.variables.getLocalVariableCollections().find(c => c.name === 'Primitives');
  const primByName = {};
  figma.variables.getLocalVariables().filter(v => v.variableCollectionId === primColl.id).forEach(v => { primByName[v.name] = v; });
  const weightVarByStyle = { 'Regular': 'fontWeight/regular', 'Medium': 'fontWeight/medium', 'Semi Bold': 'fontWeight/semibold', 'Bold': 'fontWeight/bold' };

  // [name, family, style, fontSizeKey, lineHeightPercent]
  const textStyleDefs = [
    ['Caption / Regular',       'Inter', 'Regular',   's',   150],
    ['Caption / Semibold',      'Inter', 'Semi Bold', 's',   150],
    ['Body / s / Regular',      'Inter', 'Regular',   's',   150],
    ['Body / s / Medium',       'Inter', 'Medium',    's',   150],
    ['Body / m / Regular',      'Inter', 'Regular',   'm',   150],
    ['Body / m / Medium',       'Inter', 'Medium',    'm',   150],
    ['Body / l / Regular',      'Inter', 'Regular',   'l',   165],
    ['Body / l / Medium',       'Inter', 'Medium',    'l',   165],
    ['Heading / xl / Semibold', 'Inter', 'Semi Bold', 'xl',  135],
    ['Heading / 2xl / Semibold','Inter', 'Semi Bold', '2xl', 135],
    ['Heading / 3xl / Semibold','Inter', 'Semi Bold', '3xl', 120],
    ['Heading / 4xl / Bold',    'Inter', 'Bold',      '4xl', 120],
    ['Display / 5xl / Bold',    'Inter', 'Bold',      '5xl', 120],
    ['Display / 6xl / Bold',    'Inter', 'Bold',      '6xl', 120],
    ['Label / Uppercase',       'Inter', 'Semi Bold', 's',   150],
    ['Code / Regular',          'Inter', 'Regular',   's',   150],
  ];

  const existing = {};
  figma.getLocalTextStyles().forEach(s => { existing[s.name] = s; });

  for (const [name, family, style, fsKey, lineHPct] of textStyleDefs) {
    const ts = existing[name] || figma.createTextStyle();
    ts.name = name;
    ts.fontName = { family, style }; // set BEFORE binding fontFamily/fontWeight — those calls need a loaded font on the style already
    ts.setBoundVariable('fontSize', primByName[`fontSize/${fsKey}`]);
    ts.setBoundVariable('fontFamily', primByName['fontFamily/sans']);
    ts.setBoundVariable('fontWeight', primByName[weightVarByStyle[style]]);
    ts.lineHeight = { unit: 'PERCENT', value: lineHPct }; // literal, never bound — see note above
    // letterSpacing: set per-style if the design calls for it, e.g. -3% on large headings; 0 otherwise
  }
}

await createTextStyles();
return { textStyles: figma.getLocalTextStyles().length };
```

**Inter font style note:** use `'Semi Bold'` (with space), NOT `'SemiBold'`. Verify with `await figma.listAvailableFontsAsync()` if in doubt.

**Naming instability warning:** during this file's history, `existing[name]` lookups have twice silently
failed on a subset of styles and collapsed their name to `'Body/m/Regular'` (no spaces) instead of
`'Body / m / Regular'`, even when no script explicitly renamed them — cause not fully diagnosed, possibly
a Figma-side save/sync quirk. After every run of this phase, list
`figma.getLocalTextStyles().map(s => s.name)` and check for missing spaces, not just the count.

---

### Phase 7 — Responsive typography (→ `Responsive`)

Source: `primitive.breakpoint.{mobile,tablet,desktop}` (0/768/1024px) + `primitive.fontSize.*` (desktop/
tablet — unchanged) + `semantic.fontSize.mobile.*` (87.5% of desktop, ADR-backed) + `semantic.lineHeight.*`
(paired per fontSize rung, same in every mode — lineHeight is a ratio, it doesn't itself scale by
breakpoint, only which fontSize it's paired with matters). `tablet` and `desktop` modes hold identical
values for every var — only `mobile` diverges, and only for `fontSize`.

**Scope is `primitive.fontSize >= 18px` only — currently `l` through `6xl`.** Small text (`xs`=11,
`s`=12, `m`=14 — all under the 18px threshold) doesn't get a mobile override and has no `Responsive` entry;
only the larger rungs scale down on mobile. This is a value threshold, not a fixed key list — if a future
`primitive.fontSize` edit moves a key across the 18px line, its `Responsive`/`fontSize.mobile` membership
moves with it. `semantic.lineHeight` still covers the full `xs`-`6xl` range regardless (Text Styles need a
lineHeight for every size — see Phase 6), so `Responsive.lineHeight` only mirrors the `Semantic` subset
that has a matching `fontSize.mobile` counterpart, it isn't a second independent restriction.

This is the Figma-side mirror of the `@media (max-width: 767px)` block `build.ts` emits from the same
source tokens. **Caveat:** the CSS override only reaches `--helix-primitive-fontSize-*` — component-level
fontSize vars (e.g. `--helix-button-fontSize-m`) inline their resolved value at build time rather than
referencing the primitive via `var()`, so they don't pick up the responsive override yet. That's a known
limitation of the current build pipeline (inlining, not var-chaining), not something this Figma collection
can fix on its own — Figma variable bindings on text nodes are a separate, correctly-cascading mechanism
(bind a text node's `fontSize`/`lineHeight` to this collection's variables and Figma's own mode-switching
handles it).

**Every value here must be an ALIAS, never a literal** — same rule as everywhere else in this file.
`semantic.fontSize.mobile.*` and `semantic.lineHeight.*` live in `Semantic`; Phase 7 aliases `Responsive`'s
`mobile` mode to the former and all 3 modes' `lineHeight/*` to the latter (`fontSize`'s `tablet`/`desktop`
modes alias `Primitives.fontSize.*` directly).

**Live node fontSize bindings follow the same 18px threshold:** a Figma component's text layer whose
`component.*.fontSize` token resolves to `primitive.fontSize >= 18px` (`l` and up) binds directly to
`Responsive`; below that (`xs`/`s`/`m`) binds to `Primitives` directly, since `Responsive` has nothing for
those rungs. Text Styles are the one exception that always uses `Primitives` regardless of size, per
Phase 6's mode-ambiguity note.

```js
const semColl = getOrCreateCollection('Semantic');
const semModeId = semColl.modes.find(m => m.name === 'default')?.modeId || semColl.modes[0].modeId;
const primColl = getOrCreateCollection('Primitives');
const primByName = {};
figma.variables.getLocalVariables().filter(v => v.variableCollectionId === primColl.id).forEach(v => { primByName[v.name] = v; });

// Step 1 — semantic.fontSize.mobile.* (primitive.fontSize >= 18px only) as real variables in `Semantic`
const mobileFontSize = { l: 16, xl: 21, '2xl': 28, '3xl': 35, '4xl': 42, '5xl': 49, '6xl': 56 };
const semFontSizeMobile = {};
for (const [key, px] of Object.entries(mobileFontSize)) {
  const name = `fontSize/mobile/${key}`;
  const existing = figma.variables.getLocalVariables().find(v => v.name === name && v.variableCollectionId === semColl.id);
  const v = existing || figma.variables.createVariable(name, semColl, 'FLOAT');
  v.scopes = ['FONT_SIZE'];
  v.setValueForMode(semModeId, px); // literal here is correct — this IS the source of truth for mobile fontSize
  semFontSizeMobile[key] = v;
}

// semantic.lineHeight.* already exists (Phase 3b-adjacent addition) — just read it
const semLineHeight = {};
figma.variables.getLocalVariables()
  .filter(v => v.variableCollectionId === semColl.id && v.name.startsWith('lineHeight/'))
  .forEach(v => { semLineHeight[v.name.replace('lineHeight/', '')] = v; });

// Step 2 — Responsive collection + modes
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

// Step 3 — create Responsive.fontSize/* and Responsive.lineHeight/*, l through 6xl only (>= 18px)
const keys = ['l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
const created = [];
for (const key of keys) {
  const fsName = `fontSize/${key}`;
  const existingFs = figma.variables.getLocalVariables().find(v => v.name === fsName && v.variableCollectionId === respColl.id);
  const fsVar = existingFs || figma.variables.createVariable(fsName, respColl, 'FLOAT');
  fsVar.scopes = ['FONT_SIZE'];
  fsVar.setValueForMode(mobileModeId, figma.variables.createVariableAlias(semFontSizeMobile[key]));
  const primTarget = primByName[`fontSize/${key}`];
  fsVar.setValueForMode(tabletModeId, figma.variables.createVariableAlias(primTarget));
  fsVar.setValueForMode(desktopModeId, figma.variables.createVariableAlias(primTarget));

  const lhName = `lineHeight/${key}`;
  const existingLh = figma.variables.getLocalVariables().find(v => v.name === lhName && v.variableCollectionId === respColl.id);
  const lhVar = existingLh || figma.variables.createVariable(lhName, respColl, 'FLOAT');
  lhVar.scopes = ['LINE_HEIGHT'];
  const lhTarget = semLineHeight[key];
  lhVar.setValueForMode(mobileModeId, figma.variables.createVariableAlias(lhTarget));
  lhVar.setValueForMode(tabletModeId, figma.variables.createVariableAlias(lhTarget));
  lhVar.setValueForMode(desktopModeId, figma.variables.createVariableAlias(lhTarget));

  created.push(fsName, lhName);
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

### No Phase 10 — `component.*` tokens do NOT get a Figma collection (deliberate)

A version of this file previously had a `Component` collection mirroring `tokens.json`'s `component.*`
layer 1:1 (one Figma variable per leaf, e.g. `button/fill/primary/default`). **That was removed —
`component.*` tokens live only in code, never in Figma.** When building a component in Figma
(`components-to-figma.md`), bind each node directly to whichever of `Theme`/`Semantic`/`Primitives`/
`Responsive` the matching `component.*` token aliases in `tokens.json` — resolve the alias chain yourself
(same lookup Phase 2's "Entry C" and the naming rules above already teach) rather than creating an
intermediate Figma variable for it. If you're tempted to recreate a `Component` collection because
resolving the chain by hand feels repetitive: don't — that repetition was the explicit reason it was
removed, not an oversight to fix.

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
Effect Styles, all named to match `packages/tokens/src/tokens.json` with no system prefix —
`components-to-figma` binds new component nodes to whichever of these 4 the matching `component.*` token
resolves to (no `Component` collection — see the note above Phase 9).

## Regression checklist

Run Phase 9 and confirm the counts match:

- [ ] `Primitives`: 108 vars, modes=[default] — 61 color (10 blue + 11 gray + 10 each
      green/orange/red/turquoise) + 16 spacing (round percentages only, no fractional rungs) + 11 size +
      20 typography (fontSize now has 10 rungs: `xs`...`6xl`)
- [ ] `Theme`: 58 vars, modes=[light, dark] (`fill/*` 27, `text/*` 12, `icon/*` 10, `border/*` 9 — no
      `color/` prefix)
- [ ] No `Theme` variable name contains a `-` — every grammar segment (role/interactive/
      modifier/state) is its own `/`-delimited path level (`fill/primary/interactive/light/hover`,
      not `fill/primary-interactive-light-hover`)
- [ ] `Semantic`: 36 vars, modes=[default] — 9 `radius/*` + 5 `size/*` + 5 `spacing/*` + 7
      `fontSize/mobile/*` (`l`-`6xl`, `primitive.fontSize >= 18px` only) + 10 `lineHeight/*` (full
      `xs`-`6xl` — Text Styles need every size, see Phase 6)
- [ ] `Responsive`: 14 vars, modes=[mobile, tablet, desktop] (`fontSize/l`...`fontSize/6xl` +
      `lineHeight/l`...`lineHeight/6xl` — NOT `xs`/`s`/`m`) — `tablet` and `desktop` mode values are
      identical to each other for every var, only `mobile` differs (and only for `fontSize` — `lineHeight`
      is the same in all 3 modes since the ratio doesn't change, only which fontSize it's paired with)
- [ ] No collection or style name has a system prefix (`Helix / ...`)
- [ ] `Primitives` spacing/size vars are all whole-number percentages — no `.` in any name (currently true
      by construction; re-check if a fractional rung is ever added back)
- [ ] Exactly 4 variable collections total (`Primitives`, `Theme`, `Semantic`, `Responsive`) — never a 5th
      ad-hoc collection, and specifically never a `Component` collection (removed by deliberate decision —
      see the note above Phase 9)

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
| A `TextStyle`'s bound `fontSize` shows the wrong value (e.g. the mobile-scaled number on a style meant to show the desktop size) | Bound to a variable from a multi-mode collection (`Responsive`) — `TextStyle` has no way to pick a mode, so Figma silently uses the collection's first mode | Bind Text Style `fontSize` to a single-mode collection (`Primitives`) instead — see Phase 6 |
| A `TextStyle`'s bound `lineHeight` renders absurdly large (e.g. `150px` on a 12px font) | `setBoundVariable('lineHeight', v)` interprets the variable's raw number as **pixels**, not percent or a ratio | Don't bind `lineHeight` on a `TextStyle` — compute `ratio * 100` and set `ts.lineHeight = {unit:'PERCENT', value}` as a literal instead — see Phase 6 |
| `setBoundVariable('fontFamily', v)` throws `unloaded font "Inter, ui-sans-serif, system-ui..."` (and may leave `fontName.family` corrupted) | The bound variable held the CSS fallback stack from `tokens.json`, not a single real font name Figma can load | `Primitives.fontFamily/*` must store just `'Inter'` (etc.) for Figma purposes, diverging from the JSON's CSS value — see Phase 5. If corrupted, reset with `ts.fontName = {family, style}` |
