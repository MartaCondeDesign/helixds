# @helix-ds/tokens — Agent Context

## What this package does

Transforms `src/tokens.json` (DTCG format) into:
- `dist/helix.css`  — CSS custom properties for runtime use
- `dist/index.ts`   — TypeScript constants for import

## Token format (DTCG)

Every token has `$value` and `$type`. References use `{path.to.token}` syntax:

```json
"color": {
  "fill": {
    "primary": { "$value": "{primitive.color.brand.600}", "$type": "color" }
  }
}
```

## Three layers

1. `primitive.*`  — raw scale values (brand.600, neutral.200, spacing.4)
2. `semantic.*`   — role-based aliases (color.fill.primary = brand.600)
3. `component.*`  — component-specific aliases (button.fill.rest = fill.primary)

Use semantic tokens in components. Never reference primitive tokens from component code.

## Adding a token

1. Add to `src/tokens.json` in the correct layer
2. Run `pnpm build` — this regenerates both output files
3. Reference it in component CSS as `var(--helix-{path-with-dashes})`
4. Example: `semantic.color.fill.primary` → `--helix-color-fill-primary`

## Name rules

- Token name in CSS = `--helix-` + path joined with `-`, with `primitive.` and `semantic.` removed
- `semantic.color.fill.primary` → `--helix-color-fill-primary`
- `primitive.spacing.4` → `--helix-spacing-4`

## Dark mode tokens

Dark overrides are in `dist/helix.css` under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.
When adding a semantic color token that needs a dark value, add both variants.

## What NOT to do

- Don't add raw hex values to semantic tokens — always reference a primitive
- Don't add tokens for one-off component states not shared across 3+ components
- Don't add JS-only constants that don't have a CSS counterpart
