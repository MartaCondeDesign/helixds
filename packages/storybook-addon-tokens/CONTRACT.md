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
  meta?: string;
}
```

Tabs appear above the table, always in this order, and only when the current story has
at least one token of that kind: **Color, Typography, Spacing, Radius, Sizing, Shadows**.
`space`-kind items split into the `Spacing` or `Sizing` tab automatically — `spacing` if
the part/label/token text matches `padding|margin|gap|space|inset|offset`, `sizing`
otherwise (e.g. `field.height`, `control.size`).

Table columns are **Element, Token** always, plus **Preview** — but the Preview column
only exists on the **Color** tab (a swatch). No other tab gets a Preview column at all;
`meta` (e.g. `Body small`) renders as a small caption line under the Token cell instead.

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
| `radius` | A `3px solid lilac` outline, `outline-offset: -3px` (`.helix-token-highlight-radius`) | An inset outline traces the rounded corners themselves, unlike a generic offset outline |
| `shadows` | `box-shadow` is overridden inline to a lilac elevation shadow | Shows the shadow's shape/spread in the highlight color, not just an unrelated outline |
| `spacing` | A generic lilac outline on the element **plus** a "dimension line" overlay whose length equals the token's own resolved **px value** — never the component's own width/height | It's measuring a gap/inset, not the component — a line as long as the component would misrepresent an 8px gap as "however wide the button is" |
| `sizing` | Same outline + dimension line, but the line spans the component's own **rendered height** (`getBoundingClientRect().height`) | Sizing tokens (control/field height, a control's own box size) *are* the component's dimension — the line should visibly span it, not an unrelated px count |

Dimension lines prefer drawing **outside** the component (right for `sizing`'s vertical
line, bottom for `spacing`'s horizontal line) and only fall back to hugging the
component's own edge from the inside when the viewport leaves no room outside.

This depends on every component rendering `data-helix-part="<part>"` (matching the
`part` used in its `.doc.ts` `tokens[]`, per the naming rule above) on the DOM node the
token actually affects, and `data-variant="<variant>"` on that same node when the
component has variants.
