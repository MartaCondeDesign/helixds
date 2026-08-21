# Helix Tokens Panel Contract

The Storybook addon reads `parameters.helixTokens` from the active story.

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

- Only show tabs for `kind`s present in the current story.
- `shadow` is always last if present.
- If a component has no tokens for a kind, that tab must not appear.
- `label` should describe the UI element or semantic role, not just the token name.
- `meta` should be used for typography notes like `Body small` or `Caption / label`.
