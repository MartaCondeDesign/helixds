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

How the panel renders each `kind`:

- `color` → swatch preview
- `typography` → style label in the Token column, no preview
- `space` → no preview
- `radius` → shown in the element column as the part that uses it
- `shadow` → only shown when present, and ordered last
- `variant` → when the current story has `args.variant`, color tokens only show for that variant
- `space` → keep one token per visual relationship, and label the gap, for example `gap.icon.text` or `gap.label.field`
- `typography` → keep one token per text role, and label the role, for example `label`, `value.s`, or `description`
- `value` → use when the component has a hardcoded value instead of a token; show the literal value in the Token column

Rules:

- Only show the tab at all when the active story defines `parameters.helixTokens`.
- Only show tabs for `kind`s present in the current story.
- `shadow` is always last if present.
- If a component has no tokens for a kind, that tab must not appear.
- `label` should describe the UI element or semantic role, not just the token name.
- `meta` should be used for typography notes like `Body small` or `Caption / label`.

## Hover → live-component highlight

Hovering a row does not glow the row's own preview swatch — it highlights the real,
live component instance in the preview canvas, via the manager↔preview channel event
`HELIX_HIGHLIGHT_EVENT` (`packages/storybook-addon-tokens/constants.js`):

- `register.js` (manager) emits `{ part: item.part, variant: item.variant }` on
  `onMouseEnter` and `null` on `onMouseLeave`, plus on unmount/story change.
- `preview.js` listens on that channel and toggles a `.helix-token-highlight` outline
  on every `[data-helix-part="<part>"]` element in the current story — scoped to
  `[data-variant="<variant>"]` too when `item.variant` is set and a match exists.

This depends on every component rendering `data-helix-part="<part>"` (matching the
`part` used in its `.doc.ts` `tokens[]`) on the DOM node the token actually affects,
and `data-variant="<variant>"` on that same node when the component has variants.
