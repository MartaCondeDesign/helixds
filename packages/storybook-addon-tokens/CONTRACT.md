# Helix Tokens Panel Contract

The Storybook addon reads `parameters.helixTokens` from the active story and renders a custom tab.

Each token item must follow this shape:

```ts
{
  part: string;
  label: string;
  token?: string;
  value?: string;
  kind?: 'color' | 'typography' | 'space' | 'radius' | 'shadow' | 'other';
  variant?: string;
  size?: string;
  state?: 'hover' | 'press' | 'disabled' | 'focus';
  axis?: 'horizontal' | 'vertical';
  meta?: string;
}
```

`axis` only matters for `kind: 'space'` rows in the `spacing` category (see the live-highlight table
below) — it records which direction the gap actually runs in the component's real layout (a
`flex-direction: column` gap is `'vertical'`, a row gap is `'horizontal'`), so the dimension line draws
the correct way instead of assuming horizontal. `sizing` rows never need it — sizing is always the
component's own vertical extent, hard-coded, not configurable per row.

Tabs appear above the table, always in this order, and only when the current story has
at least one token of that kind: **Color, Typography, Spacing, Radius, Sizing, Shadows**.
`space`-kind items split into the `Spacing` or `Sizing` tab automatically — `spacing` if
the part/label/token text matches `padding|margin|gap|space|inset|offset`, `sizing`
otherwise (e.g. `field.height`, `control.size`).

Table columns are **Element, Token** always, plus **Preview** — but the Preview column
only exists on the **Color** tab (a swatch). No other tab gets a Preview column at all;
`meta` (e.g. `Body small`) renders as a small caption line under the Token cell instead.
When `state` is set, the Element cell also appends a small uppercase badge (`HOVER`/`PRESS`/
`DISABLED`) after the label — several rows legitimately share one label (a fill's default/
hover/press are all "fill.primary"), and without the badge they read as duplicate rows.

Rules:

- Only show the tab at all when the active story defines `parameters.helixTokens`.
- Only show tabs for `kind`s present in the current story, in the fixed order above.
- `label` should describe the UI element or semantic role, not just the token name.
- `meta` should be used for typography notes like `Body small` or `Caption / label`.
- `value` → use when the component has a hardcoded value instead of a token; show the
  literal value in the Token column (works even without a `token` — `resolvePx` in
  `preview.js` falls back to `item.value` the same way the table does).
- `variant` → when the current story has `args.variant`, EVERY category (not just
  color) only shows tokens whose own `variant` matches — a `space`/`radius`/etc. item
  with no `variant` field always shows regardless of the selected variant.
- `size` → same mechanism as `variant`, but against `args.size`. A row tagged with a
  size (e.g. a `fontSize`/`height`/`padding` rung that genuinely differs per size) only
  shows for the currently selected size; a row with no `size` field is size-agnostic and
  always shows (e.g. `gap.icon.text`, which doesn't change across sizes). This is what
  keeps `Typography` from listing every rung the component has ever had — only the one
  rung actually rendered on screen right now.
- `state` → `'disabled'` is opt-in: a row tagged `state: 'disabled'` only shows once the
  story's own `args.disabled` is actually `true` — showing a disabled-state color by
  default would misrepresent what's currently on screen. `'hover'`/`'press'` are the
  opposite: NEVER gated behind a control (these components don't expose a "state" arg for
  pointer states), always shown whenever the component is interactive, tagged only so the
  Element/meta column can say *which* state a given row represents. **Only tag `state` on
  a row when the resolved CSS var driving that visual state actually exists and is
  consumed by the component's CSS** — do not document a `disabled`/`hover` token that the
  component's stylesheet never references (e.g. `--helix-checkbox-fill-disabled` exists as
  a token but Checkbox's disabled look is opacity-only, not a fill swap — don't add a row
  for it; a documented-but-unused token would show a live-highlight color that never
  actually appears on screen).
- **Every `spacing`/`sizing` relationship the component actually has must get a row** —
  not just the first gap that comes to mind. Audit the component's CSS for: `padding-top`,
  `padding-bottom`, `padding-start`/`padding-left`, `padding-end`/`padding-right` (as four
  separate rows — asymmetric padding, e.g. Select's wider trailing edge for its chevron, is
  real and worth seeing as two different values, not one shared "padding" row), and every
  `gap` between two visually distinct children in either axis: icon↔text, label↔field,
  control↔content, element↔element, whatever the component actually lays out. A `0`/literal
  side (no token backing it) still gets a row with `value: '0'` — the point is completeness
  of "what spacing exists here", not just "which spacings have a token." **Every `gap` row
  needs its `axis` set too** — check the actual `flex-direction` of the parent that owns the
  gap (`padding-top`/`padding-bottom` are always `'vertical'`, `padding-start`/`padding-end`
  are always `'horizontal'`; a `gap` row's axis follows whatever direction that specific
  flex container runs in, which is *not* always the same for every gap in one component —
  Input's `input-root` is `column` (gap.label.field → vertical) while its icon slot sits
  inline with the field (horizontal), so don't assume one axis for the whole component).
- **`part` must match the component's own `data-helix-part` value exactly** — the live
  highlight (below) does a literal `[data-helix-part="<part>"]` lookup, so a `part` that
  doesn't exist in the DOM (e.g. a leftover bare `'input'` when the real attribute is
  `'input-root'`) silently produces zero highlight, not an error. When a component has
  more than one meaningfully different sub-part (e.g. `input-wrapper` carries fill/border,
  `input-field` carries value text + height, `input-label` carries the label color), point
  each row at the *specific* part that CSS actually applies that property to — not a
  single root part for everything, even if the component also happens to have one.

## Hover → live-component highlight

Hovering any cell in a row does not glow the row's own preview swatch — it highlights
the real, live component instance in the preview canvas, via the manager↔preview channel
event `HELIX_HIGHLIGHT_EVENT` (`packages/storybook-addon-tokens/constants.js`). The panel
emits `{ part, variant, category, token, value, label, meta }` on `onMouseEnter` (`category`
is the resolved tab, not the raw `kind`) and `null` on `onMouseLeave`, unmount, or story
change; `preview.js` finds the target element(s) via `[data-helix-part="<part>"]`
(scoped to `[data-variant="<variant>"]` when set and a match exists) and applies a
**category-specific** treatment — never a generic outline for every kind:

| Category | What actually happens on the component | Why |
|---|---|---|
| `color` | The token's own CSS custom property is overridden inline to lilac (`el.style.setProperty(item.token, LILAC)`) | Shows exactly which pixels that specific token drives — not just "this element has some color token" |
| `typography` | `refineTypographyTarget` narrows to the `-label`/`-description`/`-error`/`-placeholder`/`-value`/`-counter` descendant matching the row's `label`/`meta` text, then overrides its `color` (not the font itself) to lilac | The row's `part` is usually the component root, not the specific text node — narrowing avoids recoloring the whole component (icons included, via `currentColor`) |
| `radius` | A `3px solid lilac` outline, **flush** to the edge — `outline-offset: 0` (`.helix-token-highlight-radius`) | Traces the rendered corner curve itself. An inset offset (an earlier version used `-3px`) reads as "there is padding/space here", which is a different token's job — radius is only ever about the corners |
| `shadows` | `box-shadow` is overridden inline to a lilac elevation shadow | Shows the shadow's shape/spread in the highlight color, not just an unrelated outline |
| `spacing` | A "dimension line" overlay, drawn on the row's own `axis` (`'horizontal'`/`'vertical'`, falls back to horizontal if unset), whose length equals the token's own resolved **px value** — never the component's own width/height, and **no outline** on the component itself. The pill label spells out the axis too (`"8px · H"`) | It's measuring a gap/inset, not the component — a line as long as the component would misrepresent an 8px gap as "however wide the button is"; an outline here would read as a `border` color highlight, which is a different token's job; and a spacing gap is genuinely NOT always horizontal (a `flex-direction: column` gap is vertical) |
| `sizing` | Same dimension line, but **always vertical** — it spans the component's own **rendered height** (`getBoundingClientRect().height`), ignoring any `axis` field — also no outline | Sizing is always the component's own total vertical extent, by definition, never conditional on layout direction — the line should visibly span it, not an unrelated px count |

Dimension lines prefer drawing **outside** the component (right for `sizing`'s vertical
line, bottom for `spacing`'s horizontal line) and only fall back to hugging the
component's own edge from the inside when the viewport leaves no room outside.

This depends on every component rendering `data-helix-part="<part>"` (matching the
`part` used in its `.doc.ts` `tokens[]`, per the naming rule above) on the DOM node the
token actually affects, and `data-variant="<variant>"` on that same node when the
component has variants.
