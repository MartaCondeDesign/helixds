---
name: icons-to-figma
description: Import Tabler Icons into Figma as native COMPONENT nodes, ready for INSTANCE_SWAP in other components
applyTo: []
---

# Skill: Icons → Figma

## Scope

Populating an "Icons" page in the Helix Figma file with native COMPONENT nodes built from Tabler
Icon SVG paths. Run this skill **before** any component skill that uses icon slots. Does not cover:
building the component that consumes these icons (see `components-to-figma`), or icons outside the
Tabler outline set.

Icon source: `@tabler/icons-react` (package installed in the monorepo).  
Path data source: `packages/core/node_modules/@tabler/icons-react/dist/esm/icons/{IconName}.mjs`  
**Source of truth for icon list and order**: `apps/storybook/stories/Icons.stories.tsx` — the `ICONS` array.

---

## Icon style: outline only

Helix DS uses the **outline** variant of Tabler Icons — stroked paths, no fill.

```
stroke-width    = 1.8          ← 24px master, per the ADR-017 stroke rule (real px by size: 12→1.3 … 24→1.8 … 32→2.0).
                                 In code, Icon applies the rule automatically — never pass stroke at a usage site.
stroke-linecap  = round
stroke-linejoin = round
fill            = none         ← NEVER fill, always outline
stroke          = currentColor ← never hardcode a color
```

**stroke-width placement rule (from official Tabler validator):**
- `stroke-width` goes on the **root `<svg>` only** — never on `<path>` child elements.
- In the Figma import SVG string we put it on `<path>` for simplicity (acceptable for Figma rendering).
- Custom icons submitted to Tabler must have it on `<svg>` root only.

**Multi-path icons:**
Tabler icons are composed of multiple `<path>` elements. The `__iconNode` array in each `.mjs` file contains an array of `[type, attrs]` entries — all `type === 'path'`. They are combined into a single `<path d="...">` by joining `d` values with a space:
```js
const d = nodes.filter(n => n[0] === 'path').map(n => n[1].d).join(' ');
```
This creates a valid SVG multi-subpath `d` attribute. Each subpath starts with its own `M` command. Stroke style applies uniformly to all subpaths. This is correct and renders identically to separate `<path>` elements with the same stroke.

**Elements:** Only `<path>` elements are allowed in Tabler icons (verified from their validator). `<circle>`, `<rect>`, `<ellipse>`, `<line>`, `<g>` etc. are converted to paths by Tabler's build script. Our `filter(n => n[0] === 'path')` is correct and complete.

Do NOT use Tabler's "filled" icon set. The outline set is always `@tabler/icons-react` default exports (`IconPlus`, `IconArrowRight`, etc.).

---

## Naming convention

Component name = icon name **without** the `Icon` prefix.  
`IconPlus` → `Plus`, `IconAlertCircle` → `AlertCircle`, `IconLayoutSidebarRight` → `LayoutSidebarRight`

No `tabler/` prefix. No `Icon` prefix. Just the bare name.

---

## Process

### Step 1 — Check whether icons already exist in Figma

```js
// use_figma: read-only check
const iconsPage = figma.root.children.find(p => p.name === 'Icons');
const existing = iconsPage
  ? iconsPage.findAll(n => n.type === 'COMPONENT').map(n => ({ id: n.id, name: n.name }))
  : [];
return { pageExists: !!iconsPage, count: existing.length, sample: existing.slice(0, 5) };
```

If `count > 0` → icons exist. Skip to **Step 4 (INSTANCE_SWAP keys)** and return the existing IDs.  
If `count === 0` → proceed with import.

---

### Step 2 — Extract path data from .mjs files

For each icon, read its `.mjs` file and extract the `__iconNode` array:

```bash
node -e "
const fs=require('fs'),path=require('path');
const base='packages/core/node_modules/@tabler/icons-react/dist/esm/icons';
const storyOrder=['IconAccessible','IconActivity',...]; // from ICONS array in Icons.stories.tsx
const result={};
for(const name of storyOrder){
  const f=path.join(base,name+'.mjs');
  const txt=fs.readFileSync(f,'utf8');
  const m=txt.match(/const __iconNode\s*=\s*(\[[\s\S]*?\]);/);
  const nodes=JSON.parse(m[1]);
  const paths=nodes.filter(n=>n[0]==='path').map(n=>n[1].d);
  result[name]=paths.join(' ');
}
console.log(JSON.stringify(result));
"
```

All 161 icons use only `path` elements (no `circle`, `rect`, or other SVG elements).

### Filled paths

Only `IconAccessible` has a path with explicit `fill="currentColor"`:
`M11.5 7.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0` (radius=0.5 head circle)

With `stroke-width="1.8"`, this tiny circle renders visually filled because the stroke covers its center — **no special treatment needed**. Use `fill="none"` for all icons uniformly.

---

### Step 3 — Icon component structure

### Layout constants

```js
const ICON_SIZE = 24;   // COMPONENT outer size (px)
const CELL      = 40;   // cell size: 24px icon + 16px gap — icons must never overlap
const ROW_MAX   = 20;   // max icons per row
```

### Flat grid — no row frames

Icons are placed **directly on the Icons page** as a flat grid. No wrapper frames, no grey rows.

```
COMPONENT "Plus"          x=0,   y=0   (index 0)
COMPONENT "Minus"         x=40,  y=0   (index 1)
...
COMPONENT "AlertCircle"   x=160, y=0   (index 4)
COMPONENT "Circle"        x=0,   y=40  (index 20, starts row 2)
```

16px gap between every icon (CELL 40 − icon 24 = 16px gap).

### Component anatomy

```
COMPONENT "Plus"   (24×24, fills: none)
  └── VECTOR "vector"  (natural bounding box, constraints: SCALE/SCALE)
```

- COMPONENT is **24×24** (matches Storybook — Tabler icons render at 24px)
- VECTOR keeps its **natural SVG bounding box** — do NOT force-resize it
- The VECTOR is named exactly `"vector"`
- Constraints must be `{ horizontal: 'SCALE', vertical: 'SCALE' }`
- **stroke-width = 1.8** (the ADR-017 rule at the 24px master size — same value `iconStrokeForSize(24)` returns in code)

### Creation pattern (addIcon function)

```js
function addIcon(name, d, idx) {
  const col = idx % ROW_MAX;
  const row = Math.floor(idx / ROW_MAX);

  // Build SVG — stroke-width 1.8 = ADR-017 rule at 24px, matches Storybook
  const fr = figma.createNodeFromSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path d="${d}" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
  );
  if (!fr.children.length) { fr.remove(); return null; }

  const vec = fr.children[0];
  const ox = vec.x, oy = vec.y;  // save natural position BEFORE reparenting

  const comp = figma.createComponent();
  comp.name = name;  // "Plus", "ArrowRight", etc. — no "Icon" prefix
  comp.resize(24, 24);
  comp.fills = [];
  comp.x = col * CELL;
  comp.y = row * CELL;

  comp.appendChild(vec);  // move vector out of wrapper frame
  fr.remove();            // delete now-empty wrapper frame

  vec.name = 'vector';
  vec.x = ox;  // restore natural SVG-coordinate position
  vec.y = oy;
  vec.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };

  // DO NOT convert the stroke to filled geometry (outlineStroke / strokeGeometry-in-place).
  // That breaks the icons. Leave the vector as a real stroke: strokeWeight = 1.8, fills empty.
  // createNodeFromSvg already parsed stroke="black" stroke-width="1.8" from the SVG above into
  // vec.strokes / vec.strokeWeight — nothing more to set here. Color gets bound to a variable
  // later (Step 3 here for a flat currentColor-equivalent, or per-variant in components-to-figma's
  // icon slot rule, which also binds to vec.strokes — keep both skills consistent on this point).

  return comp.id;
}
```

**Why save/restore position**: `createNodeFromSvg` returns a FRAME with the VECTOR at its natural bounding-box offset (e.g., `IconMinus` vector is at x≈5, y≈11.25). After `appendChild`, the VECTOR's coordinate frame shifts. Saving `ox/oy` before the move and restoring after places the artwork correctly within the 24×24 component.

**Why NOT force-resize the vector**: Tabler icon vectors have non-square natural bounding boxes (e.g., `IconMinus` is ~14×1.5px). Forcing `vec.resize(20, 20)` distorts them. Let the vector keep its natural dimensions.

**Why NOT `strokeGeometry`-in-place (don't convert the stroke to filled geometry)**: an earlier version of this skill replaced `vec.vectorPaths` with the `strokeGeometry` expansion (turning the stroke into filled vector geometry) to get the line weight to scale proportionally with the icon. **That approach breaks the icons** — import with a real stroke instead: leave `vec.strokes` as parsed from the SVG (`stroke="black" stroke-width="1.8"`), don't touch `vec.fills`/`vec.vectorPaths`. The tradeoff is that a plain resize doesn't scale `strokeWeight` proportionally (1.8px stays 1.8px at any instance size — set `strokeWeight` per instance size from the ADR-017 table if it matters) — accept that; it's not worth broken icons to avoid it.

### Idempotency

Before creating, clear the Icons page:
```js
for (const child of [...iconsPage.children]) child.remove();
```

---

### Bind every master icon's stroke to `icon/neutral`

Every icon component created on the Icons page must carry the `icon/neutral` variable as its
default stroke color — never leave it as the hardcoded `stroke="black"` the SVG import parses in.
`icon/neutral` is the base tone of the `icon.*` semantic family (see `packages/tokens/CLAUDE.md` →
"Semantic naming vocabulary"): the default color an icon renders in before any component-specific
override (Button's per-variant `icon/inverse` vs `icon/neutral`, set later in `components-to-figma`)
replaces it.

Run this once, after all `addIcon()` calls, in the same or a following `use_figma` call:

```js
// Look up icon/neutral in the Color Semantic collection
const semColl = figma.variables.getLocalVariableCollections().find(c => c.name === 'Color Semantic');
const iconNeutralVar = figma.variables.getLocalVariables()
  .find(v => v.name === 'icon/neutral' && v.variableCollectionId === semColl.id);
if (!iconNeutralVar) throw new Error('icon/neutral variable not found — run tokens-to-figma first');

// Bind every icon component's vector stroke to it
const iconVectors = iconsPage.findAll(n => n.type === 'VECTOR' && n.name === 'vector');
for (const vec of iconVectors) {
  const base = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  const bound = figma.variables.setBoundVariableForPaint(base, 'color', iconNeutralVar);
  vec.strokes = [bound]; // MUST reassign — setBoundVariableForPaint returns a NEW paint
}

return { boundCount: iconVectors.length };
```

This is the master/default binding only — when an icon is instanced into a component (Button,
Badge, ...), `components-to-figma` overrides the instance's own stroke per variant (`icon/inverse`
on filled backgrounds, `icon/neutral` on light ones) using the same `setBoundVariableForPaint`
pattern. Binding the master here just means an icon dropped anywhere with no override already shows
the correct default instead of flat black.

---

### Step 4 — Return IDs for INSTANCE_SWAP

After import, return a map of `{ 'Plus': 'componentId', 'ArrowRight': 'componentId', ... }`.

```js
// use_figma: collect existing icon component IDs
const iconsPage = figma.root.children.find(p => p.name === 'Icons');
await figma.setCurrentPageAsync(iconsPage);
const comps = iconsPage.findAll(n => n.type === 'COMPONENT');
const map = {};
comps.forEach(c => { map[c.name] = c.id; });
return { iconMap: map, count: comps.length };
```

---

### Step 5 — Entry B: targeted import (per component)

When a component skill needs specific icons not yet in Figma:

```bash
grep -oE 'Icon[A-Z][a-zA-Z]+' \
  apps/storybook/stories/{Name}.stories.tsx \
  packages/core/src/components/{Name}/{Name}.doc.ts \
  2>/dev/null | sort -u
```

Returns names like `IconArrowRight`, `IconCheck`. Strip the `Icon` prefix when looking up in `iconMap`.

### Default icon set (when no specific icons found)

| Code name | Map key |
|-----------|---------|
| IconX | X |
| IconCheck | Check |
| IconPlus | Plus |
| IconMinus | Minus |
| IconArrowRight | ArrowRight |
| IconArrowLeft | ArrowLeft |
| IconChevronDown | ChevronDown |
| IconChevronRight | ChevronRight |
| IconSearch | Search |
| IconUser | User |
| IconSettings | Settings |
| IconAlertCircle | AlertCircle |
| IconInfoCircle | InfoCircle |

---

## Integration with components-to-figma

When `components-to-figma` creates icon slots:

1. **Before Phase 2**: call this skill (Step 1 check + Steps 2–4 if needed)
2. **In Phase 2**: create icon slots as INSTANCE nodes using the default icon
3. **In Phase 4**: add `INSTANCE_SWAP` property pointing to the icon slot, with preferred values from `iconMap`

See `components-to-figma.md` — "Icon slot rule" section.

---

## Output

An "Icons" page in the Figma file containing one COMPONENT per Tabler icon (161 total, matching the
`ICONS` array in `Icons.stories.tsx`), plus an `iconMap` of `{ bareName: componentId }` for use by
`components-to-figma`'s INSTANCE_SWAP properties.

## Regression checklist

- [ ] "Icons" page exists in the Figma file
- [ ] Each icon is a COMPONENT (not a frame or group)
- [ ] Naming: bare name with no prefix — `Plus`, not `tabler/Plus`, not `IconPlus`
- [ ] All components are 24×24
- [ ] stroke-width = 1.8 (ADR-017 at 24px) on every vector's `strokeWeight` (real stroke, not converted to fill)
- [ ] `vec.strokes` is non-empty and `vec.fills` is empty on every vector — NOT the reverse
- [ ] Every vector's stroke is bound to the `icon/neutral` variable (Color Semantic collection) —
      not a flat unbound black (`boundVariables.strokes` set, run tokens-to-figma first if missing)
- [ ] No deformed icons (vectors keep natural bounding box, no forced resize)
- [ ] No row frames — flat grid directly on page
- [ ] Total count = 161 (matches `ICONS` array in `Icons.stories.tsx`)
- [ ] No duplicate icons (idempotency check passed)
- [ ] `iconMap` returned with correct IDs for INSTANCE_SWAP use

---

## References

- Icon order/list: `apps/storybook/stories/Icons.stories.tsx` (`ICONS` array)
- Path data: `packages/core/node_modules/@tabler/icons-react/dist/esm/icons/{IconName}.mjs`
- Component skill: `.ai/skills/components-to-figma.md`
- Lessons: `.ai/memory/agnostic-lessons.md`
