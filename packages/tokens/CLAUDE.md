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
    "primary": { "$value": "{primitive.color.blue.600}", "$type": "color" }
  }
}
```

## Three layers

1. `primitive.*`  — raw scale values (color.blue.600, color.gray.200, spacing.4)
2. `semantic.*`   — role-based aliases (color.fill.primary = primitive.color.blue.600)
3. `component.*`  — component-specific aliases (button.fill.primary-default = semantic.color.fill.primary)

Use semantic tokens in components. Never reference primitive tokens from component code.

## Adding a token — every one of these, every time, no exceptions

A token is not "done" once it's in `tokens.json` — it isn't finished until Figma and Storybook show
it too. Skipping either leaves designers and engineers looking at different vocabularies for the same
role, which is exactly what the naming overhaul (below) was fixing.

1. **Check the name against "Semantic naming vocabulary" below FIRST** — before writing anything.
   Prefer `pnpm token:add <dot.path> <value> [--type] [--description]` (`scripts/token-cli.ts`) over
   a manual edit: it runs this same naming check and refuses to write on a violation, then inserts
   the token via a surgical text edit (never a full re-serialize — that destroys the file's hand
   alignment).
2. Run `pnpm --filter @helix-ds/tokens build` — regenerates `dist/helix.css` and `dist/index.ts`.
3. Run `pnpm verify:tokens` — confirms the whole file is still clean, not just the new key.
4. **Update Figma** — add or rename the matching variable in the live file's `Color Semantic` (or
   other relevant) collection via `use_figma`. See `.ai/skills/tokens-to-figma.md` → "Entry C —
   single token addition" for the reusable script pattern. Renaming an existing variable: change
   `.name` in place, never create a second variable — that orphans every instance already bound to it.
5. **Update Storybook** — `apps/storybook/stories/Foundation.stories.tsx` is the living reference for
   every semantic token (`ColorSemantic` story, grouped by `Fill` / `Text` / `Icon` / `Border`). Add
   the new token to its `TokenGroup` list (or update the label on a rename) so designers/engineers
   browsing Storybook see the same vocabulary as the code and Figma.
6. Reference the token in component CSS as `var(--helix-{path-with-dashes})`.
   Example: `semantic.color.fill.primary` → `--helix-color-fill-primary`.

## Renaming or removing a token — mostly manual, check every one of these

`pnpm verify:tokens` (`scripts/verify-token-naming.ts`) checks new/renamed **keys** in `tokens.json`
against the naming rules above (no `rest`/`active`/`subtle`/`strong`/`brand`, icon tokens never
aliasing `text.*`) — run it after adding a token. It does NOT catch stale *references* to a token
you renamed elsewhere in the repo (CSS vars in `globals.css`, dark overrides in `build.ts`, Storybook,
Figma). `pnpm report:paints` is listed in the root `package.json` as where that broader check should
live, but the script doesn't exist yet (`scripts/report-paints.ts` is missing). Until it's built, grep
for the old name across the whole repo and fix every hit by hand, in this order:

1. `src/tokens.json` — rename the token, and every `{semantic....}` / `{component....}` alias that
   references it elsewhere in the same file (there are usually many).
2. `pnpm build` — regenerates `dist/helix.css` and `dist/index.ts`.
3. `src/build.ts` — the **dark-mode override map is hand-written and separate from tokens.json.** It
   will NOT pick up the rename automatically; grep it for the old `--helix-*` var name and rename the
   key. Skipping this silently breaks dark mode for that token — it keeps resolving to its old light-mode
   value baked into the wrong key.
4. `packages/core/src/globals.css` — every `var(--helix-{old-name})` reference.
5. Figma "Color Semantic" (and other) variable collections — rename the matching variable by hand via
   `use_figma` (see `.ai/skills/tokens-to-figma.md`). Nothing syncs code → Figma automatically.
6. `apps/storybook/stories/**/*.tsx` — `helixTokens` documentation arrays and any inline
   `style={{ color: 'var(--helix-*)' }}` usage. These are the most numerous and easiest to miss.
7. `.ai/maps/patterns/*.md`, `AGENTS.md`, and any other prose docs with example code.
8. Run `pnpm verify:contract && pnpm verify:props && pnpm eval:run && pnpm lint:ai` — none of these
   actually check for stale token names either, but they catch other regressions the rename might cause.

## Name rules

- Token name in CSS = `--helix-` + path joined with `-`, with `primitive.` and `semantic.` removed
- `semantic.color.fill.primary` → `--helix-color-fill-primary`
- `primitive.spacing.4` → `--helix-spacing-4`

### Semantic naming vocabulary (decided 2026-08-21)

- **Brand/accent color roles use `primary` / `secondary` / `tertiary`** — e.g.
  `semantic.color.text.primary`, `semantic.color.icon.primary`.
- **`light` / `dark` (and `lightest` / `darkest`) are modifiers for tones *added on top of* a role's
  base value — the base itself never carries one.** Every semantic color role has one base tone (its
  plain name, e.g. `neutral`, `primary`, `surface`) plus zero or more tones added beside it. A tone
  lighter than the base gets `-light` (or `-lightest` if there's an even lighter one past that); a
  tone darker than the base gets `-dark` (or `-darkest`). The base keeps the bare role name — it does
  NOT get a modifier just because it happens to be the darkest or lightest value in the group.
  - Example: `border.default` (the original/base value) → `border.neutral`; `border.subtle` (lighter
    than base, added alongside it) → `border.neutral-light`; `border.strong` (darker than base) →
    `border.neutral-dark`.
  - Example: `text.default` (the base — the only body-text color before `secondary`/`tertiary` were
    split out) → `text.neutral`, **not** `text.neutral-dark`, even though it's visually the darkest
    tone in the group. `text.secondary` (lighter than base) → `text.neutral-light`; `text.tertiary`
    (lighter still) → `text.neutral-lightest`.
  - Same logic outside gray scales: `fill.surface` (base) stays plain; `fill.surface-dark` (a darker
    surface added on top of it) gets the modifier.
  - `subtle` always maps to a `-light` modifier on the non-base tone it describes. `strong` always
    maps to `-dark`. Neither word ever survives as-is.
- **Icon color uses its own `icon.*` semantic family**, mirroring `text.*` role-for-role but bound
  independently (see `contracts/components/Icon.json` `colorRules`). Component-level icon tokens
  (`button.icon.*`, `select.icon.*`, etc.) alias `semantic.color.icon.*`.
- **Interaction states use `default` / `hover` / `press` / `disabled`** — the canonical vocabulary
  from `.ai/maps/prop-map.md` (`onPress` is the canonical prop; `active`/`isActive` are rejected
  anti-synonyms there too, so this keeps tokens and props consistent). `press` maps to the CSS
  `:active` pseudo-class — the pseudo-class name itself doesn't change, only the token name does.
  Example: `button.fill.primary-rest` → `button.fill.primary-default`.
- **A semantic key's full grammar** (decided 2026-08-21): `{role}[-interactive][-modifier][-state]`,
  read in that order — the object key it lives under (`fill`/`text`/`icon`/`border`) is the "surface"
  and isn't repeated in the key itself.
  - **`role`** — `neutral`, `primary`, `secondary`, `danger`, `success`, `warning`, `info`, etc.
  - **`interactive`** — the literal word, present only when this exact role+modifier combination
    has genuine interaction-state siblings (a `-hover` and/or `-press` variant). It exists to
    disambiguate a role that gets used BOTH as a plain static value (a headline in `primary` text
    color, no states) AND as an interactive fill/border (a `primary` button, which does have
    hover/press) — the same role name would otherwise be ambiguous about which one a given key is.
    Once a role is interactive, its base value becomes explicit: `fill.primary` → `fill.primary-interactive-default`.
  - **Skip `interactive` for a role that is interactive by definition, with no non-interactive
    counterpart to disambiguate from** — e.g. `text.link`/`text.link-hover` stay as-is. A link token
    never has a "static, non-clickable" sibling use, so the marker adds no information; only add it
    where the SAME role name is genuinely also used somewhere non-interactive.
  - **`modifier`** — `light`/`dark`/`lightest`/`darkest`, per the base-tone rule above. Sits after
    `interactive`, before `state`.
  - **`state`** — `default`/`hover`/`press`/`disabled`, present ONLY when `interactive` is present.
  - Examples: `fill.primary` → `fill.primary-interactive-default`; `fill.primary-hover` →
    `fill.primary-interactive-hover`; `fill.primary-light` (a lighter tint, also has its own hover)
    → `fill.primary-interactive-light-default`; `fill.primary-light-hover` →
    `fill.primary-interactive-light-hover`. But `fill.success-light` (a badge background — no hover
    sibling of its own) stays plain, no `interactive` layer.
  - When adding a new token, ask: does this exact value have (or will it have) a `-hover`/`-press`
    sibling, AND is the role also used somewhere non-interactive? Both yes → add `interactive` and
    make the state explicit. Either no → leave it plain.

## Dark mode tokens

Dark overrides are in `dist/helix.css` under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.
When adding a semantic color token that needs a dark value, add both variants.

## What NOT to do

- Don't add raw hex values to semantic tokens — always reference a primitive
- Don't add tokens for one-off component states not shared across 3+ components
- Don't add JS-only constants that don't have a CSS counterpart
