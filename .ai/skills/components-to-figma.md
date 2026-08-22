---
name: components-to-figma
description: Transfer a Helix DS component from code to a native Figma component set
applyTo: []
---

# Skill: Component → Figma

## Scope

Building a native Figma COMPONENT_SET from a Helix component's code contract, using the Figma MCP
(`figma-generate-library` + `use_figma`). Does not cover: creating the code contract itself (see
`ds-component-creator`), or importing icons/tokens into Figma (see `icons-to-figma` / `tokens-to-figma`,
which are prerequisites, not part of this skill).

**Prerequisite:** `tokens-to-figma` must have run first — Figma variable collections must exist.

## Files to read BEFORE starting (mandatory, in this order)

| File | What it gives you |
|------|-------------------|
| `contracts/components/{Name}.json` | Canonical props, anatomy, states, token policy |
| `packages/core/src/components/{Name}/{Name}.types.ts` | Exact TypeScript types — prop names + value unions |
| `packages/core/src/components/{Name}/{Name}.tsx` | `data-helix-part` anatomy, state attributes |
| `packages/core/src/components/{Name}/{Name}.doc.ts` | Variants list, sizes list, human descriptions |
| `.ai/maps/prop-map.md` | Canonical prop names — anti-synonyms are INVALID |
| `packages/tokens/dist/helix.css` | CSS var names to match Figma variable names |

**Never derive prop names from Figma output or visual guesses.** Always from `.types.ts` + `prop-map.md`.

## Prop taxonomy

From the files above, classify every prop into:

| Figma property type | Code source | Examples |
|--------------------|-------------|---------|
| `VARIANT` | Union types in `.types.ts` | `variant`, `size` |
| `BOOLEAN` (visibility) | Optional boolean props | `loading`, `disabled`, `icon`, `iconEnd`, `fullWidth` |
| `TEXT` | `children` / label props | `children` |

**Naming rule:** prop name in Figma = prop name in code. Lowercase. No capitalization changes.
- `variant=primary` not `Variant=Primary`
- `size=xs` not `Size=XS`

## Anatomy rule

Every layer in the Figma component must correspond to a `data-helix-part` attribute in the implementation.
Read `{Name}.tsx` and list all `data-helix-part="*"` values — these are your layer names.

Example for Button:
```
button-spinner    ← visible only when loading=true
button-icon       ← visible only when icon prop is set
button-label      ← always visible (TEXT layer)
button-icon-end   ← visible only when iconEnd prop is set
```

## Process

### Phase 0 — Gap analysis

1. Read all 6 mandatory files
2. List: variants × sizes → how many base components to create
3. Check Figma for existing components on this page — note their IDs
4. Note which Figma Color variables exist for this component's token policy
5. **Icon check** — determine if this component has icon slots (any `data-helix-part` layer whose name ends in `-icon` or `-icon-end`, or a spinner slot). If yes, run the icon discovery flow below before Phase 2.

### Icon discovery flow (run in Phase 0 if icon slots exist)

**Scenario A — Icons already imported (Icons page exists with components):**
```js
// use_figma: check for Icons page
const iconsPage = figma.root.children.find(p => p.name === 'Icons');
const iconComps = iconsPage
  ? iconsPage.findAll(n => n.type === 'COMPONENT')
  : [];
return { hasIcons: iconComps.length > 0, count: iconComps.length };
```
If `hasIcons: true` → collect `iconMap = { 'Plus': componentId, 'ArrowRight': componentId, ... }` (Step 4 of `icons-to-figma`).  
Icon names in the map have **no prefix** — `'Plus'`, not `'IconPlus'` or `'tabler/Plus'`.  
Use this map in Phase 2 to create icon slots as INSTANCE nodes with INSTANCE_SWAP.

**Scenario B — Icons NOT yet in Figma:**
1. Grep the component's story and doc files for `Icon[A-Z]*` imports:
   ```bash
   grep -oE 'Icon[A-Z][a-zA-Z]+' \
     apps/storybook/stories/{Name}.stories.tsx \
     packages/core/src/components/{Name}/{Name}.doc.ts \
     2>/dev/null | sort -u
   ```
2. Run `.ai/skills/icons-to-figma.md` (Steps 3–5) for the found icon names (or default set if none found).
3. Collect the `iconMap` returned and use it in Phase 2.

**Record in gap analysis:** state which scenario applied and which icons were imported or found.

### Phase 1 — Build individual components

Create one Figma COMPONENT per variant+size combination. Pre-position them in a grid before `combineAsVariants`.

```js
// use_figma: create one component
const comp = figma.createComponent();
comp.name = 'variant=primary, size=m'; // EXACT prop=value format, lowercase
comp.resize(width, height); // use token values from tokens.json component layer
comp.x = col * (width + gap);
comp.y = row * (height + gap);
```

**Grid layout (position BEFORE combineAsVariants):**
- Rows = sizes (xs, s, m, l, xl) × disabled states (false/true) — 2 sub-rows per size
- Columns = variants (primary, secondary, ghost, danger)

### Disabled state rule (MANDATORY)

If the component has a `disabled` prop in code, represent it as a **VARIANT**, NOT a BOOLEAN.

- Name format: `variant=primary, size=m, disabled=false` / `variant=primary, size=m, disabled=true`
- The `disabled=true` variants are clones of their `disabled=false` counterparts with `opacity = 0.5`
- This matches the code: `[data-helix-part="button"]:disabled { opacity: 0.5 }`

```js
// use_figma: after creating default variants, clone for disabled
for (const child of [...compSet.children]) {
  const clone = child.clone();
  clone.name = child.name.replace('disabled=false', 'disabled=true');
  clone.opacity = 0.5;
  compSet.appendChild(clone);
}
```

**Never use a BOOLEAN for disabled** — BOOLEAN can't express opacity changes; VARIANT makes the state visible and selectable in Figma's panel.

### Phase 2 — Build anatomy layers

For each component, add internal layers matching the `data-helix-part` structure.

### Icon slot rule — color-aware creation (CRITICAL)

Icon slots (`*-icon`, `*-icon-end`) must have their stroke color bound to the correct token **before** being nested inside the COMPONENT.

**Plugin API limitation**: once an INSTANCE is inside a COMPONENT node, its children become inaccessible (`instance.children` returns `[]`). You MUST set the stroke override while the instance is still a page-level node.

**Pattern — set stroke + size BEFORE nesting, set property refs AFTER:**
```js
// use_figma: create icon slot with correct stroke color per variant
const VARIANT_ICON_COLOR = {
  primary:   figma.variables.getVariableById('VariableID:...'), // icon/inverse (white)
  secondary: figma.variables.getVariableById('VariableID:...'), // icon/neutral
  ghost:     figma.variables.getVariableById('VariableID:...'), // icon/neutral
  danger:    figma.variables.getVariableById('VariableID:...'), // icon/inverse (white)
};
// Always bind to icon/* variables here — never text/*, even though the resolved
// color happens to match (see ADR / Icon.json colorRules: icons use their own tokens).

// Icon display size: match code usage (Button uses size={16} in Storybook → 16×16 in Figma)
const ICON_SLOT_SIZE = 16; // NOT the icon component's native 24×24

const iconComp = await figma.getNodeByIdAsync(iconMap['Plus']);
const newInst = iconComp.createInstance(); // lands on page root — children accessible

// Resize to display size BEFORE nesting (persists after nesting)
newInst.resize(ICON_SLOT_SIZE, ICON_SLOT_SIZE);

// Set stroke BEFORE nesting
const vec = newInst.children[0]; // VECTOR is accessible here
if (vec?.type === 'VECTOR') {
  const colorVar = VARIANT_ICON_COLOR[variant];
  const base = { type: 'SOLID', color: {r:0,g:0,b:0} };
  const bound = figma.variables.setBoundVariableForPaint(base, 'color', colorVar);
  vec.strokes = [bound];
  vec.fills = [];
}

newInst.name = 'button-icon';
newInst.visible = false;

// Find old slot using DIRECT CHILDREN ONLY — never findOne() on the variant
// findOne() recurses into nested instances, which crashes on dangling component refs
const oldSlot = comp.children.find(n => n.name === 'button-icon'); // ← direct children
const slotIdx = comp.children.indexOf(oldSlot);
oldSlot.remove();
comp.insertChild(slotIdx, newInst); // NOW nested — children inaccessible but override persists

// Set property references AFTER nesting (required — error if set before)
newInst.componentPropertyReferences = { visible: boolPropKey, mainComponent: swapPropKey };
```

**Icon color mapping (Helix DS):**
- `primary` / `danger` → `icon/inverse` (white icons on colored background)
- `secondary` / `ghost` → `icon/neutral` (dark icons on light background)

**When no icons are available (fallback):**
```js
// use_figma: create icon slot as plain frame placeholder
const iconSlot = figma.createFrame();
iconSlot.name = 'button-icon';
iconSlot.resize(16, 16);
iconSlot.fills = [];
iconSlot.visible = false;
comp.appendChild(iconSlot);
```

Plain frame placeholders must be replaced with real INSTANCE nodes once icons are imported.  
Note in the Phase 2 summary if fallback was used so Phase 4 can add INSTANCE_SWAP later.

### Full anatomy example (Button)

```js
// use_figma: add anatomy layers inside a component
const label = figma.createText();
label.name = 'button-label'; // matches data-helix-part
label.characters = 'Label';
comp.appendChild(label);
```

Layer order must match the visual order in code:
`button-spinner` | `button-icon` | `button-label` | `button-icon-end`

### Phase 2.5 — Auto-layout and sizing (MANDATORY before combineAsVariants)

Every component frame must have auto-layout configured. Do this PER COMPONENT before calling `combineAsVariants`.

### Sizing modes

| Mode | Figma value | When to use |
|------|-------------|-------------|
| Content hug | `'HUG'` | Default — component shrinks to its content + padding |
| Fixed | `'FIXED'` | Component has an explicit, non-responsive width |
| Fill container | `'FILL'` | Component expands to 100% of parent (triggered by `fullWidth` prop) |

**Rule: horizontal = HUG by default.** Only use FILL when the component has a `fullWidth` prop in code (`width: 100%` in CSS). Never leave it as FIXED unless the component genuinely has a fixed width in code.

**Rule: vertical = always FIXED.** Height is driven by the size token, not by content.

### How to read sizing from code

Before setting auto-layout, check the CSS and contract:
1. Does the CSS define `width: fit-content` or no explicit width? → HUG
2. Does the CSS define `width: 100%` or a `fullWidth` prop? → FILL mode exists
3. Does the CSS define `min-width`? → set `minWidth` on the component frame
4. Does the CSS define `max-width`? → set `maxWidth` on the component frame
5. Height values come from the size tokens (e.g. `--helix-button-height-m: 36px`)

### Button sizing reference (as-built)

**Bind to variables — never assign plain numbers, and bind to the `Component` collection, not
`Theme`/`Semantic`/`Primitives` directly.** Every `component.*` token has a matching Figma variable in
`Component` (see `tokens-to-figma.md` → Phase 10) — `button/height/*`, `button/padding/x/*`, etc. Bind to
those, not to the layer they alias underneath. This mirrors the code path exactly: `component.button.height.*`
→ `semantic.size.control.*` → `primitive.size.*` is 3 hops in code, and the Figma binding should land on the
`Component` variable (the outermost/nearest hop), the same way a button's fill binds to `Theme`, never to a
raw color primitive. If `Component` doesn't have a variable for something yet (rare — Phase 10 covers all
182 as of this writing), fall back to the next layer down and flag the gap rather than silently skip it.

```js
// Figma variable names per size — from the Component collection (tokens-to-figma.md Phase 10).
const HEIGHT_VAR    = { xs: 'button/height/xs', s: 'button/height/s', m: 'button/height/m', l: 'button/height/l', xl: 'button/height/xl' };
const PADDING_X_VAR  = { xs: 'button/padding/x/xs', s: 'button/padding/x/s', m: 'button/padding/x/m', l: 'button/padding/x/l', xl: 'button/padding/x/xl' };

const varMap = {};
figma.variables.getLocalVariables().forEach(v => { varMap[v.name] = v; });

// Apply per component after creating it
comp.layoutMode             = 'HORIZONTAL';
comp.layoutSizingHorizontal = 'HUG';    // content-hug — default
comp.layoutSizingVertical   = 'FIXED';  // fixed by size token
comp.primaryAxisAlignItems  = 'CENTER';
comp.counterAxisAlignItems  = 'CENTER';
comp.paddingTop              = 0;   // not token-backed in code either — literal 0 is correct here
comp.paddingBottom           = 0;
comp.itemSpacing             = 8;   // icon↔label gap — no token exists for this yet in tokens.json
comp.setBoundVariable('height',       varMap[HEIGHT_VAR[size]]);
comp.setBoundVariable('paddingLeft',  varMap[PADDING_X_VAR[size]]);
comp.setBoundVariable('paddingRight', varMap[PADDING_X_VAR[size]]);
```

`paddingTop`/`paddingBottom` (always `0`) and the icon↔label `itemSpacing` (`8`) stay plain literals — they
aren't backed by a token in `tokens.json` today either, so there's nothing to bind to yet. That's a
pre-existing gap, not something this pattern papers over; add the token first if you want those bound too.

### Min/max-width

If the contract's `sizing.width.minWidth` or `maxWidth` is not `null`, set it:
```js
if (minWidth) comp.minWidth = minWidth;
if (maxWidth) comp.maxWidth = maxWidth;
```

Button has no min/max-width in CSS — leave as `null` per contract.

### QA — sizing checklist

- [ ] Every variant has `layoutMode = 'HORIZONTAL'`
- [ ] Every variant has `layoutSizingHorizontal = 'HUG'` (not FIXED)
- [ ] Every variant has `layoutSizingVertical = 'FIXED'`
- [ ] `paddingLeft`/`paddingRight` are *bound* to the matching `Component` variable (`button/padding/x/*`,
      not a plain number that happens to match — check `boundVariables.paddingLeft` on the node)
- [ ] Gap matches itemSpacing between anatomy parts (still a plain literal — no token backs it yet)
- [ ] `height` is *bound* to the matching `Component` variable (`button/height/*`; xs=16, s=24, m=32, l=40,
      xl=48 for Button, per ADR-004) — check `boundVariables.height` on the node, not just the rendered
      pixel value
- [ ] `fills` on the component and on the label TEXT node are *bound* to `Component` (`button/fill/*`,
      `button/text/*`), not to `Theme` directly
- [ ] Label `fontSize` is *bound* to `Component` (`button/fontSize/*`), which itself aliases `Responsive`
      — never bound straight to `Primitives.fontSize/*`

### Phase 3 — Create COMPONENT_SET

After all individual components are positioned:

```js
// use_figma: combine into component set
const compSet = figma.combineAsVariants(allComponents, figma.currentPage);
compSet.name = 'Button'; // PascalCase component name
```

`combineAsVariants` reads the `name` property of each component to infer VARIANT properties.
Name format: `prop1=value1, prop2=value2` — this creates the variant properties automatically.

### Phase 4 — Add component properties (BOOLEAN, TEXT, INSTANCE_SWAP)

After `combineAsVariants`, add properties and link them to anatomy layers.

### INSTANCE_SWAP for icon slots

If icon slots were created as INSTANCE nodes (Phase 2 — icon slot rule), add INSTANCE_SWAP properties:

```js
// use_figma: add INSTANCE_SWAP property with preferred values
const iconKey = compSet.addComponentProperty('icon', 'INSTANCE_SWAP', defaultIconId);

// Set preferred values to all available Tabler icons
const preferredValues = Object.entries(iconMap).map(([name, id]) => ({
  type: 'COMPONENT', key: id
}));
compSet.editComponentProperty(iconKey, { preferredValues });

// Link to the slot layer in each child component
for (const comp of compSet.children) {
  const slot = comp.findOne(n => n.name === 'button-icon');
  if (slot && slot.type === 'INSTANCE') {
    slot.componentPropertyReferences = { mainComponent: iconKey };
  }
}
```

If icon slots are plain frames (fallback), add a BOOLEAN property instead (standard visibility control).

### BOOLEAN component properties

After `combineAsVariants`, add boolean properties and link them to layer visibility:

```js
// use_figma: add boolean properties
compSet.addComponentProperty('loading', 'BOOLEAN', false);
compSet.addComponentProperty('icon', 'BOOLEAN', false);
compSet.addComponentProperty('iconEnd', 'BOOLEAN', false);

// Link property to layer visibility on every child component
for (const comp of compSet.children) {
  const spinnerLayer = comp.findOne(n => n.name === 'button-spinner');
  if (spinnerLayer) {
    spinnerLayer.componentPropertyReferences = { visible: 'loading#0:1' };
    // The key after '#' is the property nodeId — read it from compSet.componentPropertyDefinitions
  }
}
```

**To get the correct property nodeId:**
```js
const propDefs = compSet.componentPropertyDefinitions;
// propDefs = { 'loading#0:1': { type: 'BOOLEAN', defaultValue: false }, ... }
// The key IS the propertyId to use in componentPropertyReferences
```

### Phase 5 — Bind Figma variables

For each layer that has a fill/stroke/text color, bind the corresponding Helix semantic variable:

```js
// use_figma: bind variables to fills
const allVars = figma.variables.getLocalVariables();
const varByName = {};
allVars.forEach(v => { varByName[v.name] = v; });

// Find the variable for this layer's role
// E.g. primary button background → 'fill/primary/interactive/default' — Theme collection
// vars use '/' for every grammar segment (role/interactive/modifier/state), not '-', and no
// 'color/' prefix (vars are fill/*, text/*, icon/*, border/*)
const fillVar = varByName['fill/primary/interactive/default'];

const oldFill = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
const newFill = figma.variables.setBoundVariableForPaint(oldFill, 'color', fillVar);
layer.fills = [newFill]; // MUST reassign — setBoundVariableForPaint returns a NEW paint
```

**Token policy** from the contract's `tokenPolicy.allowed`:
- `color.fill` → `Theme` collection, variable names starting with `fill/`
- `color.text` → `Theme` collection, variables starting with `text/`
- `color.icon` → `Theme` collection, variables starting with `icon/`
- `color.border` → `Theme` collection, variables starting with `border/`
- `spacing` → `Spacing` collection, FLOAT variables
- Never use `Primitives` collection variables in component fills
- Collection names have NO system prefix: use `Color`, NOT `Helix / Color`

## Output

A single Figma COMPONENT_SET per Helix component, with one COMPONENT per variant×size (and
disabled-state) combination, anatomy layers matching `data-helix-part` values, component properties
(VARIANT/BOOLEAN/INSTANCE_SWAP) wired to those layers, and every fill/stroke/text bound to a `Color`
collection semantic variable — never a hardcoded hex value.

## Regression checklist

After building the component:

- [ ] Component name matches code: PascalCase (`Button`, not `button`)
- [ ] VARIANT property names are lowercase (`variant`, `size`, `disabled`) — match code exactly
- [ ] VARIANT values are lowercase (`primary`, `xs`, `false`, `true`) — match TypeScript unions exactly
- [ ] `disabled` is a VARIANT (not BOOLEAN) — `disabled=false` / `disabled=true`, opacity 0.5 on true
- [ ] BOOLEAN property names match code (`icon`, `iconEnd`, `loading`) — NOT `disabled`
- [ ] Layer names match `data-helix-part` values from `{Name}.tsx`
- [ ] Icon slot stroke color bound to correct token per variant (inverse for primary/danger, default for secondary/ghost)
- [ ] Icon slot stroke set BEFORE nesting inside COMPONENT (Plugin API limitation — see icon slot rule)
- [ ] Every fill/stroke/text bound to a `Color` collection semantic variable (not `Primitives`)
- [ ] No hardcoded hex values — all colors come from variables
- [ ] Default variant matches contract `default` field (`variant=primary, size=m`)
- [ ] `combineAsVariants` produced a single COMPONENT_SET, not scattered COMPONENTs
- [ ] All variants have `layoutMode = HORIZONTAL`, `layoutSizingHorizontal = HUG`, `layoutSizingVertical = FIXED`
- [ ] Height per variant matches size token (read from contract `sizing.height.values`)
- [ ] Padding matches token values per size (read from contract `sizing.figma.gap`)
- [ ] min/maxWidth applied if contract `sizing.width.minWidth/maxWidth` is not null

## Common API errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Fill didn't change | `setBoundVariableForPaint` return value ignored | Capture return value and reassign `node.fills = [newFill]` |
| `editComponentProperty` can't change VARIANT default | API limitation | Set default by ordering components — first created variant is the default |
| `componentPropertyReferences` key wrong | Using prop name instead of propId | Read `compSet.componentPropertyDefinitions` to get the `name#nodeId` key |
| Text layer has no font | Font not loaded | Call `await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })` before setText |
| `findOne` callback crashes with "Node with id X not found" | `findOne` recurses into instances with dangling component refs | Use `node.children.find(n => n.name === '...')` for direct children only |
| Icon appears too large inside component | Icon slot created at component's native size (24×24) instead of display size | Resize instance to display size (e.g. 16×16) BEFORE nesting — check code for `size={N}` prop |

## References

- `contracts/component.schema.json` — schema for all contracts
- `.ai/skills/tokens-to-figma.md` — must run first to create variable collections
- `.ai/skills/icons-to-figma.md` — run in Phase 0 if component has icon slots
- `packages/core/src/components/Button/` — canonical reference for anatomy + token bindings
