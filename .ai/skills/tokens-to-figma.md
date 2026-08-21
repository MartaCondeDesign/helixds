---
name: tokens-to-figma
description: Transfer ALL Helix DS tokens to Figma — variable collections, text styles, and effect styles
applyTo: []
---

# Skill: Tokens → Figma (complete)

## Scope

Transferring `packages/tokens/src/tokens.json` into native Figma assets: variable collections
(color, spacing, radius, typography, font-family), Text Styles (bound to typography variables),
and Effect Styles (shadows). Does not cover: component creation (see `components-to-figma`, which
depends on this skill having run first) or icon import (see `icons-to-figma`).

## Source files to read FIRST (mandatory)

| File | What it gives you |
|------|-------------------|
| `packages/tokens/src/tokens.json` | Source of truth — DTCG, 3 layers |
| `packages/tokens/dist/helix.css` | Exact CSS var names + dark mode overrides |
| `packages/tokens/CLAUDE.md` | Naming rules |

**CSS var naming rule:** strip `primitive.` and `semantic.`, replace `.` with `-`, prepend `--helix-`.

---

## Naming rules

**No system prefix on any collection, text style, or effect style.**

| Wrong ❌ | Correct ✅ |
|---------|----------|
| `Helix / Primitives` | `Primitives` |
| `Helix / Color` | `Color` |
| `Helix / Caption / Regular` | `Caption / Regular` |
| `shadow / xs` | `shadow / xs` |

**Color family names in Figma = token names in code.** No translation.

| Token in `tokens.json` | Figma variable path |
|------------------------|---------------------|
| `primitive.color.blue.*` | `color/blue/*` |
| `primitive.color.gray.*` | `color/gray/*` |
| `primitive.color.green.*` | `color/green/*` |

**Dot in spacing names → hyphen:** `spacing/0.5` is invalid in Figma → use `spacing/0-5`.

---

## Overview of what to create

| Figma asset | Source | Collection name |
|------------|--------|-----------------|
| Color primitives | `primitive.color.*` | `Color Primitives` ← matches Storybook story name |
| Semantic color | `semantic.color.*` | `Color Semantic` ← matches Storybook story name, 2 modes: light / dark |
| Spacing | `primitive.spacing.*` | `Spacing` |
| Radius | `primitive.radius.*` | `Radius` |
| Typography | `primitive.fontSize/fontWeight/lineHeight/fontFamily.*` | `Typography` |
| Text Styles | Semantic text matrix | Named `{role} / {weight}` |
| Effect Styles | `primitive.shadow.*` | Named `shadow / {scale}` |

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
// COLLECTION NAME RULE: names must match Storybook story names exactly.
// primitive colors → 'Color Primitives', semantic colors → 'Color Semantic'
```

---

## Process

### Phase 1 — Primitive color variables (`Primitives`)

Scopes empty → hidden in design tool pickers.
10 steps per family (50→900). Gray also includes step 0 (white) and 800 (used in dark mode).

```js
const primColl = getOrCreateCollection('Color Primitives');
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

### Phase 2 — Semantic color variables (`Color`) with light / dark modes

```js
const semColl = getOrCreateCollection('Color Semantic');
let lightModeId, darkModeId;
if (semColl.modes.length === 1) {
  semColl.renameMode(semColl.modes[0].modeId, 'light');
  const newMode = semColl.addMode('dark');
  lightModeId = semColl.modes[0].modeId;
  darkModeId = newMode;
} else {
  lightModeId = semColl.modes.find(m => m.name === 'light')?.modeId || semColl.modes[0].modeId;
  darkModeId  = semColl.modes.find(m => m.name === 'dark')?.modeId  || semColl.modes[1].modeId;
}

const varMap = buildVarMap();

// Correct scope enum values (Figma Plugin API)
const SCOPES = ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'];

// [lightPrimitive, darkPrimitive]
// NOTE: Color collection vars use fill/*, text/*, border/* — no 'color/' prefix
const semanticColors = {
  // fill — surface
  'fill/page':               ['color/gray/0',   'color/gray/900'],
  'fill/surface':            ['color/gray/50',  'color/gray/800'],
  'fill/surface-raised':     ['color/gray/100', 'color/gray/700'],
  'fill/overlay':            ['color/gray/900', 'color/gray/900'],
  'fill/disabled':           ['color/gray/100', 'color/gray/800'],
  // fill — secondary
  'fill/secondary':          ['color/gray/100', 'color/gray/800'],
  'fill/secondary-hover':    ['color/gray/200', 'color/gray/700'],
  'fill/secondary-active':   ['color/gray/300', 'color/gray/600'],
  // fill — primary
  'fill/primary':            ['color/blue/600', 'color/blue/600'],
  'fill/primary-hover':      ['color/blue/700', 'color/blue/700'],
  'fill/primary-active':     ['color/blue/800', 'color/blue/800'],
  'fill/primary-subtle':     ['color/blue/50',  'color/blue/900'],
  'fill/primary-subtle-hover': ['color/blue/100','color/blue/800'],
  // fill — status
  'fill/danger':             ['color/red/600',  'color/red/600'],
  'fill/danger-hover':       ['color/red/700',  'color/red/700'],
  'fill/danger-active':      ['color/red/800',  'color/red/800'],
  'fill/danger-subtle':      ['color/red/50',   'color/red/900'],
  'fill/danger-subtle-hover':['color/red/100',  'color/red/800'],
  'fill/success':            ['color/green/600', 'color/green/600'],
  'fill/success-hover':      ['color/green/700', 'color/green/700'],
  'fill/success-subtle':     ['color/green/50',  'color/green/900'],
  'fill/warning':            ['color/orange/600', 'color/orange/600'],
  'fill/warning-hover':      ['color/orange/700', 'color/orange/700'],
  'fill/warning-subtle':     ['color/orange/50',  'color/orange/900'],
  'fill/info':               ['color/turquoise/600',    'color/turquoise/600'],
  'fill/info-hover':         ['color/turquoise/700',    'color/turquoise/700'],
  'fill/info-subtle':        ['color/turquoise/50',     'color/turquoise/900'],
  // text
  'text/default':            ['color/gray/900', 'color/gray/100'],
  'text/secondary':          ['color/gray/600', 'color/gray/400'],
  'text/tertiary':           ['color/gray/500', 'color/gray/500'],
  'text/disabled':           ['color/gray/400', 'color/gray/600'],
  'text/inverse':            ['color/gray/0',   'color/gray/900'],
  'text/brand':              ['color/blue/600','color/blue/400'],
  'text/link':               ['color/blue/600','color/blue/400'],
  'text/link-hover':         ['color/blue/700','color/blue/300'],
  'text/danger':             ['color/red/600', 'color/red/400'],
  'text/success':            ['color/green/700','color/green/500'],
  'text/warning':            ['color/orange/700','color/orange/500'],
  'text/info':               ['color/turquoise/700',   'color/turquoise/500'],
  // border
  'border/default':          ['color/gray/200', 'color/gray/700'],
  'border/strong':           ['color/gray/400', 'color/gray/600'],
  'border/subtle':           ['color/gray/100', 'color/gray/800'],
  'border/focus':            ['color/blue/500','color/blue/500'],
  'border/danger':           ['color/red/500', 'color/red/500'],
  'border/success':          ['color/green/500','color/green/500'],
  'border/warning':          ['color/orange/400','color/orange/400'],
  'border/inverse':          ['color/gray/700', 'color/gray/400'],
};

for (const [semName, [lightPrim, darkPrim]] of Object.entries(semanticColors)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === semName && v.variableCollectionId === semColl.id);
  const v = existing || figma.variables.createVariable(semName, semColl, 'COLOR');
  v.scopes = SCOPES;
  const lightVar = varMap[lightPrim];
  const darkVar  = varMap[darkPrim];
  if (lightVar) v.setValueForMode(lightModeId, figma.variables.createVariableAlias(lightVar));
  if (darkVar)  v.setValueForMode(darkModeId,  figma.variables.createVariableAlias(darkVar));
}

return { created: Object.keys(semanticColors).length };
```

---

### Phase 3 — Spacing variables (`Spacing`)

**Note:** dots are invalid in Figma variable names. Use hyphens: `spacing/0-5`, `spacing/1-5`, etc.

```js
const spacingColl = getOrCreateCollection('Spacing');
spacingColl.renameMode(spacingColl.modes[0].modeId, 'default');
const sModeId = spacingColl.modes[0].modeId;

const spacingTokens = {
  'spacing/0':   0,  'spacing/0-5': 2,  'spacing/1': 4,   'spacing/1-5': 6,
  'spacing/2': 8,    'spacing/2-5': 10, 'spacing/3': 12,  'spacing/3-5': 14,
  'spacing/4': 16,   'spacing/5': 20,   'spacing/6': 24,  'spacing/7': 28,
  'spacing/8': 32,   'spacing/10': 40,  'spacing/12': 48, 'spacing/14': 56,
  'spacing/16': 64,  'spacing/20': 80,  'spacing/24': 96, 'spacing/32': 128,
};

for (const [name, px] of Object.entries(spacingTokens)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === spacingColl.id);
  const v = existing || figma.variables.createVariable(name, spacingColl, 'FLOAT');
  v.scopes = ['WIDTH_HEIGHT', 'GAP'];
  v.setValueForMode(sModeId, px);
}

return { created: Object.keys(spacingTokens).length };
```

---

### Phase 4 — Radius variables (`Radius`)

```js
const radiusColl = getOrCreateCollection('Radius');
radiusColl.renameMode(radiusColl.modes[0].modeId, 'default');
const rModeId = radiusColl.modes[0].modeId;

const radiusTokens = {
  'radius/none': 0, 'radius/xs': 2, 'radius/s': 4, 'radius/m': 6, 'radius/l': 8,
  'radius/xl': 12,  'radius/2xl': 16, 'radius/3xl': 24, 'radius/full': 9999,
};

for (const [name, px] of Object.entries(radiusTokens)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === radiusColl.id);
  const v = existing || figma.variables.createVariable(name, radiusColl, 'FLOAT');
  v.scopes = ['CORNER_RADIUS'];
  v.setValueForMode(rModeId, px);
}

return { created: Object.keys(radiusTokens).length };
```

---

### Phase 5 — Typography variables (`Typography`)

Includes fontSize, fontWeight, lineHeight (FLOAT) AND fontFamily (STRING) — all in one collection.

```js
const typoColl = getOrCreateCollection('Typography');
typoColl.renameMode(typoColl.modes[0].modeId, 'default');
const tModeId = typoColl.modes[0].modeId;

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
    .find(v => v.name === name && v.variableCollectionId === typoColl.id);
  const v = existing || figma.variables.createVariable(name, typoColl, 'FLOAT');
  v.scopes = scopes;
  v.setValueForMode(tModeId, val);
}

// STRING vars (fontFamily) — same collection
const fontFamilies = {
  'fontFamily/sans': 'Inter, ui-sans-serif, system-ui, sans-serif',
  'fontFamily/mono': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};
for (const [name, value] of Object.entries(fontFamilies)) {
  const existing = figma.variables.getLocalVariables()
    .find(v => v.name === name && v.variableCollectionId === typoColl.id);
  const v = existing || figma.variables.createVariable(name, typoColl, 'STRING');
  v.scopes = ['FONT_FAMILY'];
  v.setValueForMode(tModeId, value);
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

## Output

Five Figma variable collections (`Primitives`, `Color`, `Spacing`, `Radius`, `Typography`), plus
Text Styles and Effect Styles, all named to match `packages/tokens/src/tokens.json` with no system
prefix — ready for `components-to-figma` to bind against.

## Regression checklist

Run Phase 9 and confirm the counts match:

- [ ] `Primitives`: 61 vars, modes=[default] (10 blue + 11 gray + 10 each green/orange/red/turquoise)
- [ ] `Color`: 47 vars, modes=[light, dark] (`fill/*`, `text/*`, `border/*` — no `color/` prefix)
- [ ] `Spacing`: 20 vars, modes=[default]
- [ ] `Radius`: 9 vars, modes=[default]
- [ ] `Typography`: 19 vars, modes=[default] (17 FLOAT + 2 STRING fontFamily)
- [ ] `textStyles`: 15
- [ ] `effectStyles`: 6
- [ ] No collection or style name has a system prefix (`Helix / ...`)
- [ ] Dot-containing token names were converted to hyphens (e.g. `spacing/0-5`, not `spacing/0.5`)

---

## Common API errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `FONT_WEIGHT` is not a valid scope | Wrong enum | Use `'FONT_WEIGHT'` exactly; check Plugin API types |
| `COLOR_FILLS` invalid | Wrong scope enum | Use `'ALL_FILLS'`, `'STROKE_COLOR'`, `'EFFECT_COLOR'` |
| Invalid variable name with `.` | Dot not allowed | Replace `.` with `-` in Figma names: `spacing/0-5` |
| Font style `SemiBold` not found | Missing space | Inter uses `'Semi Bold'` (two words) |
| `setBoundVariableForPaint` ignored | Return value dropped | Capture return and reassign: `node.fills = [newPaint]` |
| Alias loop | Primitives not created first | Always run Phase 1 before Phase 2 |
| Mode limit | Free plan allows 1 mode | Requires Figma Professional or higher |
