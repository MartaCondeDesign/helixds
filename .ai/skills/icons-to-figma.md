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
stroke-width    = 1.5          ← Helix DS override (Tabler default is 2). Always pass stroke={1.5} at usage site.
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

With `stroke-width="1.5"`, this tiny circle renders visually filled because the stroke covers its center — **no special treatment needed**. Use `fill="none"` for all icons uniformly.

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
- **stroke-width = 1.5** (matches `stroke={1.5}` used in `Icons.stories.tsx` icon browser)

### Creation pattern (addIcon function)

```js
function addIcon(name, d, idx) {
  const col = idx % ROW_MAX;
  const row = Math.floor(idx / ROW_MAX);

  // Build SVG — stroke-width 1.5 to match Storybook
  const fr = figma.createNodeFromSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path d="${d}" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
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

  // REQUIRED: outline stroke IN-PLACE so the icon scales correctly at any size.
  // Figma strokes are absolute px — a 1.5px stroke at 24px stays 1.5px when resized to 16px.
  // strokeGeometry is the fill geometry of the stroke, in vec's LOCAL coordinate space.
  // Replace vectorPaths on the SAME node — no new node, no resize, no position offset needed.
  // Creating a new node + resize shrinks the icon because vec.width excludes stroke half-width.
  const geom = vec.strokeGeometry;
  if (geom && geom.length > 0) {
    vec.vectorPaths = geom.map(p => ({ windingRule: p.windingRule, data: p.data }));
    vec.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }];
    vec.strokes = [];
  }

  return comp.id;
}
```

**Why save/restore position**: `createNodeFromSvg` returns a FRAME with the VECTOR at its natural bounding-box offset (e.g., `IconMinus` vector is at x≈5, y≈11.25). After `appendChild`, the VECTOR's coordinate frame shifts. Saving `ox/oy` before the move and restoring after places the artwork correctly within the 24×24 component.

**Why NOT force-resize the vector**: Tabler icon vectors have non-square natural bounding boxes (e.g., `IconMinus` is ~14×1.5px). Forcing `vec.resize(20, 20)` distorts them. Let the vector keep its natural dimensions.

**Why `strokeGeometry` in-place**: `outlineStroke()` does not work in the Plugin API. `strokeGeometry` returns the stroke expansion as `VectorPath[]` in the node's **local coordinate space**. The correct approach is to replace `vec.vectorPaths` with the strokeGeometry data ON THE SAME NODE — no new node, no `resize()`, no position offset. Creating a new VectorNode and calling `filled.resize(vec.width, vec.height)` shrinks the icon by ~1px per side because `vec.width` excludes the stroke half-width (0.75px). In-place replacement avoids all coordinate issues: the geometry stays in the same local space at the correct position. Required for **correct scaling**: Figma stroke widths are absolute px — a 1.5px stroke on a 24px icon stays 1.5px when resized to 16px. With strokeGeometry the line weight IS fill geometry and scales proportionally.

### Idempotency

Before creating, clear the Icons page:
```js
for (const child of [...iconsPage.children]) child.remove();
```

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
- [ ] stroke-width = 1.5 used during SVG creation (input to strokeGeometry calculation)
- [ ] All vectors converted via `strokeGeometry` — filled VECTOR node, strokes array is empty
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
