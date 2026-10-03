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

## Non-negotiable rules (added 2026-10-02 — every one of these was broken in a real handoff)

Input, Textarea, Chip, Badge and ChipGroup were "synced" with wrong colors, literal and negative spacing,
spacer frames and no hover/press/focus states. These rules exist so that never ships again. A component is
not done until **Phase 6's audit passes** — `pnpm verify:stable` won't show it as ✓/stable otherwise.

1. **Every state, always.** The set has a `state` VARIANT axis with every value in the contract's
   `figma.states` (default, hover, press, focus, disabled, invalid… whatever the component has). Hover,
   press and focus don't exist as props in code (they're CSS pseudo-classes) — they are **figma-only
   properties** and must be declared in the contract's `figma.properties` with `"figmaOnly": true`
   (see `contracts/component.schema.json` → `figma`). Designing only "default + disabled" is a failed sync.
   A `disabled` prop folds into this same `state` axis — not a separate `disabled=true/false` axis.
2. **Colors come from code, not from reading CSS.** Run `pnpm figma:expected <Name>` (Storybook running):
   it renders each variant × state in light AND dark and records the real computed colors. Bind each
   fill/stroke/text to the Theme variable that produces that color. Never a raw hex, never a Primitives
   variable. A CSS `color-mix(a X%, b)` has no variable: bind the fill to `b` and add a child rectangle
   named **`state-layer`** (absolute, constraints STRETCH, radius bound) filled with `a` at **layer**
   opacity X% (a paint-level opacity is lost on instances — layer opacity isn't).
3. **Spacing is always a bound variable — never a node, never negative.** Every non-zero padding,
   `itemSpacing`, `counterAxisSpacing` and corner radius is bound to a spacing/radius variable. No empty
   frame or rectangle used as a spacer. No negative `itemSpacing` to overlap parts. If code needs two
   different distances on one row (e.g. Chip: 4px gap + 2px on the icon's label side), model the extra one
   as padding on the part that owns it in code (the `chip-icon` span has the 2px → a `chip-icon` frame with
   `paddingRight` bound to `spacing/3xs`). An off-scale distance (6px, 10px…) is split into scale tokens across
   nested auto-layouts — in code first, then mirrored in Figma (Badge: 6px = root `spacing/2xs` 4px +
   `badge-content` `spacing/3xs` 2px). Never a literal, never a variable outside the scale.
4. **The border is always there** (`.ai/maps/patterns/border-always.md`). If a layer has a stroke in one
   variant it has it in all of them, same weight — states only change its color. A "no visible border"
   state binds the stroke to the fill's own variable.
5. **Show/hide parts are BOOLEANs, never VARIANTs** (`.ai/maps/patterns/show-hide-parts.md`). An optional
   part that only appears/disappears (icon, iconEnd, dismiss ×, description…) is a BOOLEAN property on the
   part's visibility, named like the code prop — that keeps the variant count down (Chip: 100 → 50). This
   only works because the component is built (in code first) so the part carries its own spacing and the
   container's paddings never change with it. If code switches a padding with the prop, fix the code first.
   A VARIANT only when the part also changes something else's color/size/state — documented in the
   contract's `figma.properties`.
6. **Lay the set out as a Propstar property table** (Phase 7) — the same output as the
   [Propstar](https://www.figma.com/community/plugin/1116018586739867857) "Create property table" command.
7. **Plugin-API traps that produce wrong colors silently** (all hit on 2026-10-02):
   - **Fallback color.** A bound paint still carries a plain `color`, and Figma paints *that* in some
     renders (main components edited by script showed solid black while instances looked right). Always
     build a bound paint with `color` = the variable's resolved light value, never `{r:0,g:0,b:0}`:
     `const val = v.resolveForConsumer(node).value; setBoundVariableForPaint({ type: 'SOLID', color: { r: val.r, g: val.g, b: val.b } }, 'color', v)`.
   - **Paint opacity is ignored on a bound paint** (the variable's alpha wins) — model a CSS `color-mix`
     with a `state-layer` child and LAYER opacity (rule 2), never a second fill at 16%.
   - **A shadow's `spread` only renders on a frame with `clipsContent = true`** — focus rings built from
     spread shadows need it on every variant.
   - **An absolute `state-layer` with STRETCH constraints doesn't follow the variant's own hug-resize** —
     resize it to the final variant size after text styles are applied (instances then stretch fine).
8. **Audit before recording.** Phase 6 must return `pass: true`, and its result is recorded in
   `contracts/figma-sync.json` (`audit: { pass, commit, date, counts }`) next to `syncedCommit`.

## Files to read BEFORE starting (mandatory, in this order)

| File | What it gives you |
|------|-------------------|
| `.ai/maps/figma-map.md` | **Read first.** Generated (`pnpm docs:figma-map`) per-component table of every prop → Figma property type, name and values, plus the anatomy layer names from `data-helix-part`. It applies this skill's taxonomy and exceptions — if it ever disagrees with this skill, the skill wins and the generator (`scripts/docs-figma-map.ts`) needs fixing. |
| `contracts/components/{Name}.json` | Canonical props, anatomy, states, token policy |
| `packages/core/src/components/{Name}/{Name}.types.ts` | Exact TypeScript types — prop names + value unions |
| `packages/core/src/components/{Name}/{Name}.tsx` | `data-helix-part` anatomy, state attributes |
| `packages/core/src/components/{Name}/{Name}.doc.ts` | Variants list, sizes list, human descriptions |
| `.ai/maps/prop-map.md` | Canonical prop names — anti-synonyms are INVALID |
| `packages/tokens/dist/helix.css` | CSS var names to match Figma variable names |

**Never derive prop names from Figma output or visual guesses.** Always from `.types.ts` + `prop-map.md`.

## Prop taxonomy

Classify every prop from the files above by its code shape, then convert using the general rule below.
Prop *names* are canonical vocabulary (`.ai/maps/prop-map.md`) — this taxonomy is about prop *shape*,
which only matters here, for the Figma conversion.

### Step 1 — code shape

| Prop shape       | TypeScript pattern                                          | Examples                                      |
|-------------------|---------------------------------------------------------------|-------------------------------------------------|
| Boolean           | `prop?: boolean`                                               | `loading`, `disabled`, `fullWidth`, `required`  |
| Variant / enum    | `prop?: 'a' \| 'b' \| 'c'` (union type)                         | `variant`, `size`                               |
| Text / string     | `prop?: string`, or `children?: React.ReactNode` (label-only)  | `label`, `placeholder`, `children`              |
| Icon reference    | `prop?: TablerIcon` — component reference, never a pre-instantiated element or string | `icon`, `iconEnd` |
| Event handler     | `prop?: (event) => void`                                       | `onPress`, `onChange`, `onFocus`, `onBlur`, `onDismiss` |
| Nested content    | `children?: React.ReactNode` holding another component         | e.g. a `Card`'s body                            |

### Step 2 — code shape → Figma property type

Figma component properties come in exactly 4 types: `BOOLEAN`, `TEXT`, `INSTANCE_SWAP`, `VARIANT`.

### General rule

| Code prop shape | Figma property type | Examples |
|--------------------|-------------|---------|
| Boolean (simple show/hide, no visual variant) | `BOOLEAN` | `loading`, `fullWidth` |
| Variant/enum (union type, multiple selectable values) | `VARIANT` | `variant`, `size` |
| Text / label | `TEXT` | `children` (label-only), `placeholder` |
| Icon component reference | `BOOLEAN` (is it shown) **+** `INSTANCE_SWAP` (which icon), both bound to the same layer — see "Icon slots need BOTH..." below | `icon`, `iconEnd` |
| `children` nesting another component / arbitrary content | *not a component property* — a nested anatomy layer built in Phase 2, not `addComponentProperty` (don't call this a "slot property" — "slot" already means *icon slot* throughout this skill) | e.g. a `Card`'s body |

### Exceptions to the general rule

| Prop | Code type | Figma property type | Why |
|------|-----------|---------------------|-----|
| `disabled` | `boolean` | a value of the `state` VARIANT axis (`state=disabled`), not BOOLEAN | BOOLEAN can't express a color/opacity change; folding it into `state` keeps every visual state on one axis — see Phase 2.75 |
| `icon` / `iconEnd` | icon component reference | falls back to `BOOLEAN`-only if the icon library isn't imported into Figma yet (no `INSTANCE_SWAP` without real icon components to reference) | see "Icon discovery flow" and "Icon slots need BOTH..." below |
| `onPress`, `onChange`, `onDismiss` | event handler | *(no Figma property — skipped)* | JS-only behavior, nothing to represent visually |
| `required` (when no asterisk rendered) | `boolean` | *(no Figma property — skipped)* | No visual difference in the anatomy |

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

Create one Figma COMPONENT per variant × size × state combination (Phase 2.75 lists the states and where
their colors come from). Collect every component into one array as you create it (e.g.
`allComponents = []`) — Phase 3 needs ALL of them in a single `combineAsVariants` call.

```js
// use_figma: create one component
const comp = figma.createComponent();
comp.name = 'variant=primary, size=m, state=default'; // EXACT prop=value format, lowercase
comp.resize(width, height); // use token values from tokens.json component layer
comp.x = col * (width + gap);
comp.y = row * (height + gap);
allComponents.push(comp);
```

**Layout:** position doesn't matter at this point — Phase 7 lays the finished set out as a Propstar
property table. Just keep components from overlapping.

A `disabled` prop is a value of the `state` VARIANT axis, NOT a BOOLEAN — full rule in Phase 2.75.

### Phase 2 — Build anatomy layers

For each component, add internal layers matching the `data-helix-part` structure.

### Icon slot rule — color-aware creation (CRITICAL)

Icon slots (`*-icon`, `*-icon-end`) must have their stroke color bound to the correct token **before** being nested inside the COMPONENT.

**Plugin API limitation**: once an INSTANCE is inside a COMPONENT node, its children become inaccessible (`instance.children` returns `[]`) **while it, or any ancestor, is hidden** — to edit an existing hidden slot later, set `visible = true` on it and its hidden ancestors, edit, then hide them again (the BOOLEAN binding survives). You MUST set the stroke override while the instance is still a page-level node.

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
  // Stroke WEIGHT = the ADR-017 real px for this display size (a resize never scales strokeWeight,
  // and the 24px master is 1.8): 12→1.3 · 14→1.4 · 16→1.5 · 18→1.5 · 20→1.7 · 24→1.8 · 28→2.0 ·
  // 32→2.2 · 36→2.4 · 40→2.8 (ICON_STROKE_PX_BY_SIZE in Icon/iconStroke.ts). Only exception:
  // Checkbox's mark, 1.5 at 12px (ADR-017 §5).
  vec.strokeWeight = 1.5; // ICON_SLOT_SIZE 16
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

**Bind to variables — never assign plain numbers. There is no `Component` collection in Figma** —
`component.*` tokens live only in code. Bind each property directly to whichever of
`Theme`/`Semantic`/`Primitives`/`Responsive` the matching `component.*` token resolves to: walk the alias
chain in `tokens.json` yourself (`component.button.height.*` → `semantic.size.*` — bind to
`Semantic`; `component.button.padding.x-*` → `primitive.spacing.*` — bind to `Primitives`).

**Typography is the one exception — never bind `fontSize`/`lineHeight` as loose Variables on the label
node.** Apply a real named Figma Text Style instead (`label.setTextStyleIdAsync(...)`). This isn't a
style preference — a loose binding silently misses `fontFamily`/`fontWeight` entirely, which is exactly
what happened to Button in production: see "Text Styles are mandatory, not a fallback" below for the
incident and the real fix.

**Code is the source of truth for which style name to use — Figma is reference only** (root `CLAUDE.md`
rule 8). Derive it from `tokens.json`: `component.button.fontSize.{size}` aliases to
`semantic.textStyle.{key}.fontSize` — that `{key}` (kebab-case, e.g. `caption-semibold`) converts to the
Figma Text Style name via `tokens-to-figma.md` Phase 6's naming convention (Title Case, `/`-joined:
`'Caption / Semibold'`). `contracts/figma-sync.json` only records whether the *live Figma file* currently
matches that — useful to catch drift, never the source you derive the name from.

```js
// Figma variable names per size — resolved one hop from tokens.json's component.button.* aliases.
// Button's size scale is s/m/l — see ButtonSize in Button.types.ts, the source of truth (not Figma).
const HEIGHT_VAR    = { s: 'size/s', m: 'size/m', l: 'size/l' }; // Semantic
const PADDING_X_VAR = { s: 'spacing/75', m: 'spacing/100', l: 'spacing/125' }; // Primitives
// fill/text — variant-keyed, not size-keyed. No entry for 'ghost' in fill (matches code: no
// component.button.fill.ghost token exists — ghost stays unbound/transparent).
const FILL_VAR = { primary: 'fill/primary/interactive/default', secondary: 'fill/secondary/interactive/default', danger: 'fill/danger/interactive/default' };
const TEXT_VAR = { primary: 'text/inverse', secondary: 'text/neutral', ghost: 'text/neutral', danger: 'text/inverse' };
// Named Text Style per size — derived from tokens.json: component.button.fontSize.s/m alias to
// semantic.textStyle.caption-semibold.fontSize, component.button.fontSize.l aliases to
// semantic.textStyle.body-m-semibold.fontSize. Kebab-case key -> Figma name via the Phase 6 convention.
const TEXT_STYLE = { s: 'Caption / Semibold', m: 'Caption / Semibold', l: 'Body / m / Semibold' };

const primByName = {}, semByName = {}, themeByName = {}, respByName = {};
figma.variables.getLocalVariables().forEach(v => {
  const cName = figma.variables.getVariableCollectionById(v.variableCollectionId)?.name;
  if (cName === 'Primitives') primByName[v.name] = v;
  if (cName === 'Semantic') semByName[v.name] = v;
  if (cName === 'Theme') themeByName[v.name] = v;
  if (cName === 'Responsive') respByName[v.name] = v;
});

// Apply per component after creating it (variant, size both come from the component's name)
comp.layoutMode             = 'HORIZONTAL';
comp.layoutSizingHorizontal = 'HUG';    // content-hug — default
comp.layoutSizingVertical   = 'FIXED';  // fixed by size token
comp.primaryAxisAlignItems  = 'CENTER';
comp.counterAxisAlignItems  = 'CENTER';
comp.paddingTop              = 0;   // not token-backed in code either — literal 0 is correct here
comp.paddingBottom           = 0;
comp.itemSpacing             = 8;   // icon↔label gap — no token exists for this yet in tokens.json
comp.setBoundVariable('height',       semByName[HEIGHT_VAR[size]]);
comp.setBoundVariable('paddingLeft',  primByName[PADDING_X_VAR[size]]);
comp.setBoundVariable('paddingRight', primByName[PADDING_X_VAR[size]]);

const fillVar = themeByName[FILL_VAR[variant]]; // undefined for 'ghost' — leave unbound, matches code
if (fillVar) comp.fills = [figma.variables.setBoundVariableForPaint(comp.fills[0], 'color', fillVar)];

const label = comp.findOne(n => n.type === 'TEXT' && n.name === 'button-label');
const textVar = themeByName[TEXT_VAR[variant]];
if (textVar) label.fills = [figma.variables.setBoundVariableForPaint(label.fills[0], 'color', textVar)];

// Typography: apply the real named Text Style — never bind fontSize/lineHeight loose on the node.
const textStyles = await figma.getLocalTextStylesAsync();
const style = textStyles.find(s => s.name === TEXT_STYLE[size]);
await label.setTextStyleIdAsync(style.id);
```

`paddingTop`/`paddingBottom` (always `0`) and the icon↔label `itemSpacing` (`8`) stay plain literals — they
aren't backed by a token in `tokens.json` today either, so there's nothing to bind to yet. That's a
pre-existing gap, not something this pattern papers over; add the token first if you want those bound too.

### Text Styles are mandatory, not a fallback

`tokens-to-figma.md` Phase 6 creates named, reusable Figma Text Styles (`'Caption / Semibold'`, `'Body /
m / Semibold'`, `'Heading / xl / Semibold'`, ...) that bundle all 4 typography properties — `fontSize`,
`fontFamily`, `fontWeight`, `lineHeight` — each bound to a Variable, in one object. **Every component
label must apply one of these via `setTextStyleIdAsync`. There is no manual fallback** — binding
`fontSize`/`lineHeight` as loose Variables directly on a text node, instead of applying a named style, is
not a lesser alternative, it's the specific bug already found and fixed once:

> *(`contracts/figma-sync.json`, `typographyGapFoundAndFixed2026-08-24`)* — "Component text should always
> be applied via a real named Figma text style (`setTextStyleIdAsync`), never a loose fontSize variable
> binding on its own — a loose binding misses `fontWeight`/`lineHeight`/`fontFamily` entirely and was the
> bug this note is recording so it isn't reintroduced."

```js
// use_figma: apply an existing named Text Style to a label
const textStyles = await figma.getLocalTextStylesAsync();
const style = textStyles.find(s => s.name === 'Body / m / Medium');
await label.setTextStyleIdAsync(style.id);
```

**If the exact style you need doesn't exist yet** (this happened for 4 of 20 styles on 2026-08-24 — see
the same `figma-sync.json` note), create it in `tokens-to-figma.md` Phase 6 first, bound to the same
`fontSize`/`lineHeight`/`fontFamily`/`fontWeight` Variables as its nearest sibling style. Don't reach for
a loose per-node binding as a shortcut instead — that's what caused the incident.

**Finding which style name applies to a given component/size — derive it from code, not from Figma:**
`tokens.json`'s `component.{name}.fontSize.{size}` aliases to `semantic.textStyle.{key}.fontSize` — that
`{key}` is the answer (kebab-case; convert to the Figma name via Phase 6's Title-Case-`/`-joined
convention). For Button: `component.button.fontSize.s`/`.m` alias to
`semantic.textStyle.caption-semibold` → `'Caption / Semibold'`; `.l` aliases to
`semantic.textStyle.body-m-semibold` → `'Body / m / Semibold'`. `contracts/figma-sync.json` records
whether the live file currently has that applied — check it to catch drift (or confirm the style already
exists in Figma before you build), not as the source of the name itself.

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
- [ ] `paddingLeft`/`paddingRight` are *bound* to the matching `Primitives` variable (`spacing/*`, not a
      plain number that happens to match — check `boundVariables.paddingLeft` on the node)
- [ ] Gap matches itemSpacing between anatomy parts (still a plain literal — no token backs it yet)
- [ ] `height` is *bound* to the matching `Semantic` variable (`size/*`) — check `boundVariables.height`
      on the node, not just the rendered pixel value. Verify the size scale itself against the
      component's own `.types.ts` union (source of truth) before assuming ADR-004's generic 5-step
      ladder applies — Button's is `ButtonSize = 's' | 'm' | 'l'` only (`s`=24, `m`=32, `l`=40), not
      `xs`-`xl`
- [ ] `fills` on the component and on the label TEXT node are *bound* to `Theme` (`fill/*`, `text/*`)
      directly — there is no `Component` collection to bind to instead
- [ ] Label typography uses a real named Text Style (`label.setTextStyleIdAsync(...)`) — check
      `label.textStyleId` is set to a non-empty id, not just that the label *looks* right. **Never** a
      loose `fontSize`/`lineHeight` Variable binding on the node instead — that exact pattern was shipped
      on every Button label across all 40 size/variant/state combinations, silently missing
      `fontWeight`/`fontFamily` too, and wasn't caught by rendering alone (the pixel value looks fine
      either way). Fixed 2026-08-24 — see `contracts/figma-sync.json`'s `typographyGapFoundAndFixed...`
      note. Derive the *correct* style name from `tokens.json` (`component.{name}.fontSize.{size}` →
      `semantic.textStyle.{key}`), not from Figma — `figma-sync.json` only confirms whether Figma matches.

### Phase 2.75 — States (MANDATORY)

Build one component per variant × size × **state**, where `state` takes every value in the contract's
`figma.states` — from scratch, before the single `combineAsVariants` call (adding states to an existing set
later means rebuilding it; see Phase 3's CRITICAL note). Name format: `…, state=hover`.

Each state's look comes from `.ai/figma-expected/{Name}.json` (`pnpm figma:expected <Name>`), never from
guessing at CSS:

- **hover / press**: the fill/stroke/text the browser computes with the pointer over / pressed on it.
- **focus**: same colors as default, plus the focus ring — two DROP_SHADOW effects bound to Theme
  variables: an inner `spread 2` in `fill/page` (the outline offset) and an outer `spread 4` in
  `border/focus` (the 2px outline). Never a second stroke or an extra frame.
- **disabled**: exactly what code shows. Since 2026-10-02 most components use real disabled tokens
  (`fill/disabled`, `text/disabled`, `icon/disabled`, `border/neutral/light`) at opacity 1 — but a
  component may still use opacity (Chip: its variant colors at 0.72). Read it from the expected file.
- **invalid** (form fields): border `border/danger`.

### Phase 3 — Create COMPONENT_SET

After all individual components — both disabled states, from Phase 2.75 — are positioned:

```js
// use_figma: combine into component set
const compSet = figma.combineAsVariants(allComponents, figma.currentPage);
compSet.name = 'Button'; // PascalCase component name
```

`combineAsVariants` reads the `name` property of each component to infer VARIANT properties.
Name format: `prop1=value1, prop2=value2` — this creates the variant properties automatically.

**CRITICAL — call `combineAsVariants` EXACTLY ONCE per set, ever.** Never call it a second time on
components that already have `variantProperties` from a prior combine, even after moving them out onto a
page first. Discovered 2026-08-24: adding a `disabled` axis to an existing Chip COMPONENT_SET, and
separately adding icon/spinner anatomy to an existing Button COMPONENT_SET, both did this (extract children
→ mutate → `combineAsVariants` again) and both silently corrupted the set — the call completes without
throwing and reports the expected child count, but `componentPropertyDefinitions`/`variantProperties` then
throw `"Component set for node has existing errors"`, and every child's `.name` degrades to a garbled
`"=value, =value"` string with property-name prefixes stripped. **There is no repair API** — the only fix
is deleting the broken set and rebuilding the components from scratch (fresh `figma.createComponent()`
calls, never `.clone()` of anything that was ever inside a COMPONENT_SET) in one single `combineAsVariants`
call. What IS safe on an already-combined set: `appendChild`/`insertChild` of new anatomy layers directly
onto existing children (adding an icon slot, a spinner, a trailing icon — confirmed working repeatedly),
plus `addComponentProperty`/`componentPropertyReferences`/`editComponentProperty` — anything that doesn't
touch `combineAsVariants` or a child's `.name`. If a component needs a genuinely NEW VARIANT AXIS after
the fact (not just a Boolean/Text/InstanceSwap property), there is no safe in-place path: delete and
rebuild clean, in one pass, from the start.

### Phase 4 — Add component properties (BOOLEAN, TEXT, INSTANCE_SWAP)

After `combineAsVariants`, add properties and link them to anatomy layers.

**Order every property to match the component's Storybook Controls panel — within two groups, not
fully interleaved.** Figma's own Properties panel always groups Variant-type properties separately from
Boolean/Text/InstanceSwap, regardless of `addComponentProperty` call order or `combineAsVariants` order —
confirmed via `compSet.componentPropertyDefinitions` on Chip: `label`/`icon`/`iconEnd`/`dismissible` (added
via `addComponentProperty` after the set already existed) came back BEFORE `variant`/`size`/`checked`/
`disabled` (the original Variant axes), i.e. grouped by type, not creation order. True full interleaving
matching Storybook exactly (`variant, size, checked, disabled, icon, iconEnd, dismissible` all mixed) is
**not achievable** on this platform — don't attempt it. What IS controllable, and should always be done:
(1) order the segments in each component's name string (`variant=X, size=Y, checked=Z`) to match
Storybook's Variant-prop order; (2) call `addComponentProperty` for Boolean/Text/InstanceSwap props in
Storybook's order too. Skip props with no Figma equivalent: JS event handlers (`onPress`, `onChange`,
`onDismiss`) and behavioral props with no visual difference in the anatomy (e.g. `required` when no
asterisk is rendered). Never add a Boolean/Text/InstanceSwap property before its anatomy layer exists —
a property wired to nothing is worse than no property, since it looks complete in the panel but does
nothing when toggled.

### Icon slots need BOTH a BOOLEAN and an INSTANCE_SWAP property

An icon slot is controlled by **two** component properties bound to the *same* layer, not one or the
other — a `BOOLEAN` (is the icon shown at all?) and an `INSTANCE_SWAP` (which icon renders when it is
shown?). This matches what the Phase 2 icon slot rule already assumes
(`newInst.componentPropertyReferences = { visible: boolPropKey, mainComponent: swapPropKey }`) — create
both keys here before that binding happens.

```js
// use_figma: create both properties for one icon slot ('icon' → button-icon layer)
const boolKey = compSet.addComponentProperty('icon', 'BOOLEAN', false);
const swapKey = compSet.addComponentProperty('icon', 'INSTANCE_SWAP', defaultIconId);

// Set preferred values to every imported Tabler icon
const preferredValues = Object.entries(iconMap).map(([name, id]) => ({
  type: 'COMPONENT', key: id
}));
compSet.editComponentProperty(swapKey, { preferredValues });

// Link BOTH properties to the same layer in every child component
for (const comp of compSet.children) {
  const slot = comp.children.find(n => n.name === 'button-icon'); // direct children only — see findOne warning below
  if (slot?.type === 'INSTANCE') {
    slot.componentPropertyReferences = { visible: boolKey, mainComponent: swapKey };
  }
}
```

Repeat the same pair for `iconEnd` → `button-icon-end`. A duplicate base name (`icon` used for both the
BOOLEAN and the INSTANCE_SWAP) is fine — the actual property key is `name#nodeId` (see
`componentPropertyDefinitions` below), and the `nodeId` half is what Figma guarantees unique, not the name.

**Fallback — no icon library imported yet:** create the slot as a plain frame (Phase 2 fallback) and add
only the `BOOLEAN` property (standard visibility control) — there's no `INSTANCE_SWAP` without real icon
components to reference yet. Note in the Phase 4 summary that the fallback was used, so a later pass can
add the `INSTANCE_SWAP` property once icons are imported (see `icons-to-figma.md`).

### Other BOOLEAN component properties

Non-icon boolean props (e.g. `loading`) follow the same pattern, just without the INSTANCE_SWAP pairing:

```js
// use_figma: add a plain boolean property
compSet.addComponentProperty('loading', 'BOOLEAN', false);

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

### Phase 6 — Audit (MANDATORY, blocks the sync)

1. `pnpm figma:expected <Name>` — writes `.ai/figma-expected/<Name>.json` (needs a spec in
   `scripts/figma/expected-styles.ts`; add one for a new component — use a story with **no `play`
   function**, a failing play covers the component with Storybook's error overlay).
2. Run `scripts/figma/audit-component.js` through `use_figma`, with `SET_ID`, `PAGE_ID` and `EXPECTED`
   (= that JSON) filled in. It checks: (1) colors bound to Theme, (2) spacing/radius bound, no negative gaps,
   (3) no spacer nodes, (4) every `figma.states` value present, (5) color parity with code in light and dark,
   (6) the border-always rule.
3. Fix and re-run until `pass: true`. Then record in `contracts/figma-sync.json`:
   `"syncedCommit": "<git rev-parse HEAD>", "audit": { "pass": true, "commit": "<same>", "date": "…", "counts": {…} }`.
   `scripts/figma-drift.ts` refuses ✓ without it.

### Phase 7 — Property table (Propstar layout)

Run `scripts/figma/property-table.js` through `use_figma` (`PAGE_ID`, `SET_ID`, `BOOLEANS` = the boolean
properties to expand, e.g. `['icon']`). It reproduces Propstar's "Create property table": a `❖ {Name}`
GRID frame, values of the first variant axis as row labels, the other axes (booleans outermost) as nested
column headers with brackets, dashed `#9747FF` cells with 24px padding, the real COMPONENT_SET placed over
the all-booleans-false cells and instances in the rest. Labels are Propstar's purple annotation chrome, not
design tokens.

## Output

A single Figma COMPONENT_SET per Helix component, with one COMPONENT per variant×size (and
disabled-state) combination, anatomy layers matching `data-helix-part` values, component properties
(VARIANT/BOOLEAN/INSTANCE_SWAP) wired to those layers, and every fill/stroke/text bound to a `Color`
collection semantic variable — never a hardcoded hex value.

## Regression checklist

After building the component:

- [ ] Phase 6 audit returned `pass: true` and is recorded in `figma-sync.json` with `syncedCommit`
- [ ] `state` axis has every value in the contract's `figma.states`; figma-only properties are declared in
      the contract's `figma.properties`
- [ ] No negative `itemSpacing`, no spacer frames, every padding/gap/radius bound to a variable
- [ ] Every bordered layer has its stroke in every variant, same weight (border-always.md)
- [ ] The set sits in a Propstar property table (Phase 7)

- [ ] Component name matches code: PascalCase (`Button`, not `button`)
- [ ] VARIANT property names are lowercase (`variant`, `size`, `disabled`) — match code exactly
- [ ] VARIANT values are lowercase (`primary`, `xs`, `false`, `true`) — match TypeScript unions exactly
- [ ] `disabled` is a value of the `state` axis (not a BOOLEAN, not its own axis) — colors as in the expected file
- [ ] BOOLEAN property names match code (`icon`, `iconEnd`, `loading`) — NOT `disabled`
- [ ] Icon slots have BOTH a BOOLEAN (visibility) and an INSTANCE_SWAP (which icon) property bound to the
      same layer via a single `componentPropertyReferences = { visible: ..., mainComponent: ... }` call —
      not just one or the other (unless the icon-library fallback applies, BOOLEAN-only)
- [ ] INSTANCE_SWAP `preferredValues` includes every icon in `iconMap`, not just the default one
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
- `.ai/skills/ds-component-creator.md` — produces the contract, `.types.ts`, and `.tsx` files this skill
  reads in "Files to read BEFORE starting"; run it first if the component doesn't exist in code yet
- `.ai/skills/tokens-to-figma.md` — must run first to create variable collections; Phase 6 creates the
  named Text Styles this skill applies to labels
- `.ai/skills/icons-to-figma.md` — run in Phase 0 if component has icon slots
- `contracts/figma-sync.json` — an audit log of whether the *live Figma file* currently matches code for
  each component (variant/token match, Text Style names actually applied, known incidents). Code
  (`.types.ts`, `tokens.json`, contracts) is still the source of truth per root `CLAUDE.md` rule 8 —
  this file only tells you where Figma has drifted from it, or confirms a past fix landed; never derive
  a variable/style name or a size scale from it instead of from code.
- `packages/core/src/components/Button/` — canonical reference for anatomy + token bindings
