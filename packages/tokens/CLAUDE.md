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
2. **`$description` — required for every `semantic.*` token, forbidden on `primitive.*` and
   `component.*`.** A new `semantic.*` token must ship with a one-line `$description` explaining what
   it's *for* (usage/intent — "Primary button background, hover state" — not a restatement of the
   value). `primitive.*` and `component.*` tokens never get one: primitives are raw, role-agnostic
   scale values with nothing to explain, and `component.*` tokens' purpose is already stated by their
   own dot-path (`component.button.fill.primary` doesn't need a description saying "Button's primary
   fill"). If you're renaming or editing an existing `semantic.*` token and it has no `$description`,
   add one as part of that change — don't leave it missing. When editing via a manual text edit (not
   `token:add`), insert it as the last field on the same single line as `$value`/`$type`
   (`{ "$value": "...", "$type": "...", "$description": "..." }`) — this file uses compact single-line
   token objects throughout; never reformat one into multi-line just to add a field, and never run the
   whole file through a JSON pretty-printer to make an edit — that rewrites every token's formatting and
   produces a multi-thousand-line diff for a one-line change.
   The same `$description` text is the SSOT for Figma variable `.description` and Storybook token copy:
   do not author a second explanation elsewhere.
3. Run `pnpm --filter @helix-ds/tokens build` — regenerates `dist/helix.css` and `dist/index.ts`.
4. Run `pnpm verify:tokens` — confirms the whole file is still clean, not just the new key.
   **For a color token specifically, also check WCAG AA contrast against its paired fill by hand** —
   `verify:tokens` checks naming, not contrast, and a token that looks fine next to a same-hue sibling
   (e.g. `danger` reusing a different primitive step than `success`/`warning`/`info` do) can quietly fail
   4.5:1 while the others pass. See root `CLAUDE.md` rule 9. Check both light and dark mode's resolved
   pair independently.
5. **Update Figma** — add or rename the matching variable in the live file's `Theme` (or
   other relevant) collection via `use_figma`, **and set the Figma variable's own `.description` to the
   same text as `$description`** (Figma Variables have a native `description` property — set it
   directly, don't just leave the info in `tokens.json`). See `.ai/skills/tokens-to-figma.md` → "Entry C —
   single token addition" for the reusable script pattern. Renaming an existing variable: change
   `.name` in place, never create a second variable — that orphans every instance already bound to it.
6. **Update Storybook — mandatory, no exceptions, for every layer, not just color.**
   `apps/storybook/stories/Foundation.stories.tsx` is the living reference for the whole token set, one
   story per category: `ColorPrimitives`, `ColorSemantic`, `Spacing` (primitive + semantic sections),
   `Radius`, `Sizing` (`semantic.size.*`), `Typography` (primitive + semantic line-height
   sections), `Shadows` (primitive + semantic sections). **A token addition, rename, or removal in
   `tokens.json` is not done until its matching story reflects it** — check every story that touches the
   category you changed, not just the first one that comes to mind.
   - **Prefer deriving the story's token list from the generated build output
     (`packages/tokens/dist/index.ts`'s `tokens` export) over a hardcoded array of keys**, wherever a
     section can reasonably do so (e.g. `Object.keys(tokens.semantic.spacing)` instead of
     `['xs','s','m','l','xl']`). A hardcoded array requires a human to remember to edit this file on every
     token change; deriving from `tokens` makes the story pick up a new/renamed/removed key automatically
     on the next build, with no story edit needed at all — that's what "must reflect token changes" should
     mean in practice, not just "someone remembered to update it." Where a section still uses a hardcoded
     array (most of `Foundation.stories.tsx` does, as of this writing — converting it is a separate,
     larger refactor, not implied by adding one token), updating that array by hand remains mandatory
     until the section is migrated to derive from `tokens`.
   - This applies to `ColorSemantic`'s existing `TokenGroup` lists as it always did (add the new token, or
     update the label on a rename) — extend the same expectation to whichever other story covers the
     category you touched.
7. Reference the token in component CSS as `var(--helix-{path-with-dashes})`.
   Example: `semantic.color.fill.primary` → `--helix-color-fill-primary`.
8. **Run `pnpm docs:token-exceptions` after every token add/edit — not just `component.*` ones.** This
   regenerates `.ai/maps/component-token-exceptions.md` from the current `tokens.json`; the table between
   its `<!-- AUTO -->` markers is generated, never hand-edited (see that file's own "do not hand-edit"
   section). A `semantic.*`/`primitive.*`-only change is typically a no-op for the table — confirm that by
   running the command, don't assume it. A `component.*` add/edit that skips `semantic.*` (aliases
   `primitive.*` directly, or is a raw literal) will show up as a new/changed 🚩 or 🆕 row automatically; if
   it's a genuine, ADR-backed exception (not just a judgment call), add it to `KNOWN_EXCEPTIONS` in
   `scripts/audit-token-exceptions.ts` and rerun — see that file's own header comment and
   `component-token-exceptions.md`'s legend for what qualifies as ✅.

**Adding or renaming a `primitive.fontSize.{key}` specifically:** always add/rename the matching
`semantic.lineHeight.{key}` in the same change (same key name, e.g. a new `fontSize.7xl` needs a
`lineHeight.7xl`) — see "Token layers" → `semantic.lineHeight` below for why. A fontSize rung with no
paired lineHeight is an incomplete addition. In `tokens.json` this pairing is a unitless ratio
(`tight`/`snug`/`normal`/`relaxed`), and it **never varies by breakpoint** — CSS scales it automatically
against whatever `font-size` applies, so there is no `semantic.lineHeight.mobile.*` token and there never
needs to be one. **In Figma the value is not the same as JSON's** — because Figma has no percent/ratio unit
for a bound variable, `Primitives.lineHeight/{key}` (Figma-only, keyed like `fontSize`, not named by ratio)
must be created as the resolved `fontSize × ratio` in **px**, as a literal — the one point the ratio and a
concrete fontSize meet, and the only literal in the whole chain. `Semantic.lineHeight/{key}` **aliases**
that Primitives value — one single, pure t-shirt-scale listing, `xs` through `6xl`, the canonical
`tokens.json`-mirroring reference. If the new rung is `l` or larger, also add `fontSize.mobile.{key}` (87.5%
of the new value, literal — this IS a real `tokens.json` token) in `Semantic`, then `Responsive.fontSize/
{key}` + `Responsive.lineHeight/{key}` (3 modes each). `fontSize`'s `desktop`/`tablet` modes alias
`Primitives.fontSize/{key}`, `mobile` aliases `Semantic.fontSize.mobile.{key}`. `lineHeight`'s **all 3
modes** alias the same `Primitives.lineHeight/{key}` — no mobile-specific computation, because the ratio
doesn't change by breakpoint. **Binding a Text Style or live node:** below 18px, bind both properties
straight to `Primitives` (`Primitives.fontSize/{key}` and `Primitives.lineHeight/{key}`) — not `Semantic` —
exactly mirroring how `fontSize` already has no `Semantic` base listing to bind to; at/above 18px, bind both
to `Responsive`. See `.ai/skills/tokens-to-figma.md` → Phase 5/6/7 for the exact script.

## Renaming or removing a token — mostly manual, check every one of these

`pnpm verify:tokens` (`scripts/verify-token-naming.ts`) checks new/renamed **keys** in `tokens.json`
against the naming rules above (no `rest`/`active`/`subtle`/`strong`/`brand`, icon tokens never
aliasing `text.*`, AND — since 2026-08-25 — that every `-light`/`-dark`/`-lightest`/`-darkest` key
actually resolves lighter/darker than its role's base tone and its own siblings, via
`checkRelativeLightness` in `token-naming-lib.ts`: it follows the alias chain to a literal hex,
computes HSL lightness, and compares) — run it after adding a token. `pnpm token:add` runs this same
relative check before writing a new `semantic.color.*` key, refusing to write one that fails it. It
does NOT catch stale *references* to a token
you renamed elsewhere in the repo (CSS vars in `globals.css`, dark overrides in `build.ts`, Storybook,
Figma). `pnpm report:paints` is listed in the root `package.json` as where that broader check should
live, but the script doesn't exist yet (`scripts/report-paints.ts` is missing). Until it's built, grep
for the old name across the whole repo and fix every hit by hand, in this order — `contracts/manifest.json`
(`pnpm docs:manifest`) has every component's implementation path if you need to jump straight to a
specific one instead of grepping blind:

1. `src/tokens.json` — rename the token, and every `{semantic....}` / `{component....}` alias that
   references it elsewhere in the same file (there are usually many).
2. `pnpm build` — regenerates `dist/helix.css` and `dist/index.ts`.
3. `src/build.ts` — the **dark-mode override map is hand-written and separate from tokens.json.** It
   will NOT pick up the rename automatically; grep it for the old `--helix-*` var name and rename the
   key. Skipping this silently breaks dark mode for that token — it keeps resolving to its old light-mode
   value baked into the wrong key.
4. `packages/core/src/globals.css` — every `var(--helix-{old-name})` reference.
5. Figma "Theme" (and other) variable collections — rename the matching variable by hand via
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

### Token layers — what lives where

The 3 top-level keys in `tokens.json` (`primitive`, `semantic`, `component`) each hold a fixed set of
categories. This is the layer-first index; "Structure per token category" below covers the same ground
category-first, with the exact key grammar for each.

- **`primitive`** — raw, component-agnostic scales. Nothing here means anything on its own; everything is
  a value to be aliased.
  - `color` — hue ramps (`blue`, `gray`, `green`, `orange`, `red`, `turquoise`), steps `0`/`50`-`900`
  - `spacing` — percentage scale, `100` = `16px` anchor
  - `size` — percentage scale, same anchor, kept separate from `spacing` (see below)
  - `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `fontFamily` — typography scales
  - `breakpoint` — `mobile`/`tablet`/`desktop` (0/768/1024px) — media-query thresholds, not applied CSS
    properties themselves
  - `shadow`, `zIndex`, `duration`, `easing` — everything else with no per-role meaning
- **`semantic`** — role-based meaning, still component-agnostic. Answers "what is this *for*", not "which
  component uses it".
  - `color` — `fill`/`text`/`icon`/`border` roles (the "theme" — what the Figma `Theme` collection mirrors)
  - `radius` — `none`/`xs`/`s`/`m`/`l`/`xl`/`2xl`/`3xl`/`full` (radius has **no** primitive layer — the
    semantic names ARE the scale, nothing to alias underneath)
  - `size.control` — the ADR-004 control/field height ladder (`xs`-`xl`)
  - `spacing` — `xs`/`s`/`m`/`l`/`xl` t-shirt scale, plus the older `component-*`/`layout-*` context scale
  - `fontSize.mobile` — the `<tablet` override for each `primitive.fontSize.*` rung that's
    **`>= 18px`** (currently `l` through `6xl`; `s`/`m` don't get a mobile override — 87.5% of
    desktop, see ADR, feeds the `@media (max-width: 767px)` block `build.ts` emits).
  - `lineHeight` — one entry per `primitive.fontSize.*` key, **full range, same key name, every rung, no
    exceptions** (unlike `fontSize.mobile` above, `lineHeight` is NOT threshold-limited — Text Styles need
    a lineHeight for every size, including the ones below 18px):
    `semantic.lineHeight.s` pairs with `fontSize.s`, `semantic.lineHeight.l` with `fontSize.l`, etc.
    (`primitive.fontSize.xs`/11px and its paired `semantic.lineHeight.xs` were removed 2026-08-23 — `s`,
    12px, is now the smallest rung; every `component.*` token that aliased `fontSize.xs` was repointed to
    `fontSize.s`.)
    **Rule: adding a new `primitive.fontSize.{key}` rung requires adding a matching
    `semantic.lineHeight.{key}` in the same change, always; add `semantic.fontSize.mobile.{key}` too only
    if the new rung's value is `>= 18px`.**
  - `shadow` — `xs`-`xl`/`focus`, aliasing `primitive.shadow.*` 1:1
  - Beyond `fontSize.mobile` and `lineHeight` above, there is no broader `semantic.typography` — no
    `fontWeight`/`fontFamily`/`letterSpacing` role layer exists; those stay primitive-only (Figma Text
    Styles are the de facto semantic layer combining all of typography together; see `tokens-to-figma.md`).
- **`component`** — one key per component (`button`, `input`, `badge`, `chip`, `card`, `dialog`, `textarea`,
  `select`, `checkbox`, `radio`, `switch`). Each aliases `semantic.*` where a role fits, or `primitive.*`
  directly when there's no semantic concept to route through (radius is the one exception that always goes
  through `semantic.radius` now, since that's the only layer it has).

**CSS pipeline caveat:** `build.ts` *inlines* resolved alias values rather than emitting `var()` chains —
`--helix-button-fontSize-m` gets the literal `12px`, not `var(--helix-primitive-fontSize-s)`. This means the
`primitive.breakpoint`-driven responsive override only reaches `--helix-primitive-fontSize-*` directly; it
does not cascade into semantic/component fontSize vars yet. Making it cascade everywhere would mean
switching the whole pipeline from inlining to `var()` chaining — a bigger, separate change, not something
the breakpoint feature did as a side effect.

**Figma collection layout:** the live Figma file groups all of the above into exactly 4 collections —
`Primitives` (every `primitive.*` category, plus the Figma-only resolved-px `lineHeight/{key}` — see below),
`Theme` (`semantic.color.*`, light/dark modes), `Semantic` (`semantic.radius.*` + `semantic.size.*`
+ `semantic.spacing.*` + `semantic.fontSize.mobile.*` + `semantic.lineHeight.*` — **one single, pure
t-shirt-scale `lineHeight` listing, `xs` through `6xl`, no mobile variant**), `Responsive` (desktop/tablet/
mobile modes, in that creation order, for `fontSize` and `lineHeight`). **Every `Semantic`/`Responsive`
value is an ALIAS, no exceptions — `lineHeight` included.** The only literal is `Primitives.lineHeight/
{key}` (resolved px, Figma-only, one per key — no mobile variant either, since the ratio never changes by
breakpoint, only `fontSize` does) plus `Semantic.fontSize.mobile.{key}` (the mobile-scaled source of truth
for `fontSize`, a real `tokens.json` token). `Responsive.lineHeight/{key}` aliases the same
`Primitives.lineHeight/{key}` in **all 3 modes** — it exists in `Responsive` purely so a Text Style/node
whose `fontSize` is `Responsive`-bound can bind `lineHeight` from the same collection, not because the value
differs by breakpoint. (An earlier iteration tried giving `lineHeight` its own mobile-scaled resolved-px
number, at various layers — all deleted; there was never a second number to compute.) Not one collection
per `tokens.json` category — but also, deliberately, **no `Component` collection**: `component.*` tokens
live only in code. A Figma component like Button binds each property directly to whichever of the 4
collections above its matching `component.*` token resolves to in code (walk the alias chain by hand),
never through an intermediate per-component Figma variable. See `.ai/skills/tokens-to-figma.md` → the note
above Phase 9 for why that was tried and reverted.

**Typography binding rule (Figma, both directions — code→Figma and Figma→code) — the 18px threshold:**

> **Rule: `fontSize` AND `lineHeight` bindings — on a live node, a Figma component, OR a Text Style, no
> exception by node type — reference `Responsive` when the resolved `primitive.fontSize` is `>= 18px`
> (`l` and up), and `Primitives` **directly** below that (`xs`/`s`/`m`) — never `Semantic`, for either
> property.** Applies identically to both properties — there's no case where `fontSize` uses `Responsive`
> but its paired `lineHeight` doesn't, or vice versa, and no case where one binds to `Primitives` while the
> other binds to `Semantic`. `Semantic.lineHeight/{key}` still exists (the canonical `tokens.json`-mirroring
> token), it's just never the binding target — exactly mirroring how `fontSize` has no `Semantic` base
> listing to bind to at all (only `Semantic.fontSize.mobile.*` exists, and only for the `Responsive` case).
> This governs new tokens too: adding a `primitive.fontSize.{key} >= 18px` means its
> `semantic.lineHeight.{key}` also gets a `Responsive` entry — see "Adding a token" above.

Two platform constraints make this actually work in Figma, both of which apply when creating a **new**
token pair, not just reusing existing ones:

1. **Mode ambiguity** — a `TextStyle` can't pin which mode of a multi-mode collection it reads, it always
   resolves to mode 0. `Responsive`'s modes are created/ordered `desktop`/`tablet`/`mobile` (`desktop` =
   mode 0, the default) so that a Text Style bound to `Responsive` shows the correct desktop/reference size
   without needing to pin anything.
2. **No percent/ratio unit for bound variables** — a `lineHeight` bound to a Figma Variable is always read
   as **pixels**, never a percent or ratio. This is resolved once: `Primitives.lineHeight/{key}` (Figma-only,
   keyed exactly like `fontSize`, NOT a set of named-ratio variables) stores the resolved `fontSize × ratio`
   as a literal. Everything else keeps full alias discipline: `Semantic.lineHeight/{key}` aliases it (one
   single `Semantic` listing, for reference); `Responsive.lineHeight`'s **all 3 modes** alias that same
   value too — there's no mobile-specific number to compute, because the ratio doesn't change by breakpoint,
   only `fontSize` does. Aliasing straight to a raw ratio would reproduce a "150px line-height on a 12px
   font" bug — that's why the resolved-px step has to happen at all, once, in `Primitives`.
   `tokens.json`/CSS keeps `semantic.lineHeight.*` as a unitless ratio (so `line-height: 1.5` scales with
   `font-size` in the browser, including a user's zoom or a WCAG 1.4.12 text-spacing override — switching
   code to px would make CSS *less* accessible, not more consistent with Figma); the Figma-only
   `Primitives.lineHeight/{key}` diverges from that JSON value on purpose, same precedent as
   `Primitives.fontFamily/*` diverging from the CSS fallback stack.

`fontFamily`/`fontWeight` don't vary by breakpoint at any size, so they always reference `Primitives`
directly, with no threshold to apply. See `.ai/skills/tokens-to-figma.md` → Phase 5, Phase 6, and Phase 7
for the full detail and the exact script pattern to follow when adding a new rung.

See `.ai/skills/tokens-to-figma.md` → "Collection layout" for the full mapping, naming
rules, and the alias-resolution algorithm.

### Structure per token category

Not every category uses all 3 layers, and only color has a full combinatorial grammar (see below) — the
others are flatter, single-axis scales.

All categories DO have `component.*` tokens (`button.padding`, `button.radius`, `badge.fontSize`...) — the
difference is whether `component` reaches primitive *through* semantic, or aliases primitive *directly*,
skipping semantic:

**Color** — `primitive → semantic → component`, component always goes through semantic, full grammar:
- `primitive.color.{scale}.{50-900}` — e.g. `blue.600`
- `semantic.color.{surface}.{role}[-interactive][-modifier][-state]` — `surface` = `fill`/`text`/`icon`/`border`,
  e.g. `fill.primary-interactive-hover`
- `component.{name}.{surface}.{variant}[-state]` — e.g. `button.fill.primary-hover` → aliases the `semantic.*` token above

**Spacing** — percentage-keyed primitive scale, `100` = `16px` (`1rem`) anchor; component tokens still alias
`primitive` directly (the semantic layer is real now but not yet wired into any component):
- `primitive.spacing.{pct}` — e.g. `spacing.100` = 16px, `spacing.150` = 24px, `spacing.50` = 8px
- `semantic.spacing.{xs,s,m,l,xl}` — t-shirt scale (8/12/16/24/32px), aliases `primitive.spacing.{50,75,100,150,200}`.
  The older `component-*`/`layout-*` context keys still exist alongside it — neither is referenced by any
  `component.*` token yet (check before assuming either is live)
- `component.{name}.padding`/`gap`/etc. → aliases `primitive.spacing.*` directly, e.g. `button.padding.x-m` →
  `{primitive.spacing.100}`, `input.gap.label` → `{primitive.spacing.25}`

**Border-radius** — semantic-only, no primitive layer at all (there's no smaller unit to derive a radius
scale from — the named steps themselves are the source of truth):
- `semantic.radius.{size}` — `none`/`xs`/`s`/`m`/`l`/`xl`/`2xl`/`3xl`/`full`
- `component.{name}.radius` → `{semantic.radius.*}`, e.g. `button.radius` → `{semantic.radius.m}`,
  `badge.radius` → `{semantic.radius.full}`

**Typography** — 4 independent primitive scales, plus one composite semantic layer that combines them:
- `primitive.fontSize.{size}` — `s`...`6xl` (`xs`/11px was removed 2026-08-23 — `s`/12px is the smallest rung)
- `primitive.fontWeight.{name}` — `regular`/`medium`/`semibold`/`bold`
- `primitive.lineHeight.{name}` — `tight`/`snug`/`normal`/`relaxed`
- `primitive.letterSpacing.{name}` — `tight`/`normal`/`wide`/`wider`
- **`semantic.textStyle.{key}`** — a DTCG **composite** token (`$type: "typography"`), added 2026-08-23. Each
  `$value` is an object aliasing 4 primitives at once — `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`
  (the last aliasing `semantic.lineHeight.{fontSize's key}`, per the pairing rule below) — under one named
  role, e.g. `semantic.textStyle.body-s-medium`. These 16 styles mirror the Figma file's Text Styles 1:1
  (`.ai/skills/tokens-to-figma.md` → Phase 6) — they ARE the semantic layer for typography; `component.*`
  tokens should match one of these (by fontSize+fontWeight combo) before falling back to a direct primitive
  alias. `scripts/text-styles.ts` loads and reshapes this JSON for `scripts/audit-token-exceptions.ts` and
  `apps/storybook/stories/Foundation/TextStyles.stories.tsx` — neither holds its own copy of the list.
  `build.ts`'s `flatten()`/`buildTs()` special-case an object `$value` (see `isComposite()`) to emit one CSS
  var per sub-property (`--helix-textStyle-body-s-medium-fontSize`, etc.) instead of the single-leaf path
  every other token takes — this is currently the only composite token category in the file.
- `component.{name}.fontSize`/`fontWeight` → alias a **sub-property of the matching `semantic.textStyle.*`**
  when one exists (added 2026-08-23) — e.g. `badge.fontSize` → `{semantic.textStyle.caption-semibold.fontSize}`,
  `badge.fontWeight` → `{semantic.textStyle.caption-semibold.fontWeight}`. This is a path that continues
  *past* a composite token into one of its own sub-properties — `resolveRef()` (`build.ts`) and `getNode()`
  (`scripts/audit-token-exceptions.ts`) both special-case this: reaching a composite mid-path routes the
  remaining segments into its `$value` object instead of treating them as further child keys. Falls back to
  a direct `primitive.fontSize.*`/`primitive.fontWeight.*` alias only where no `semantic.textStyle.*` entry
  matches yet (`.ai/maps/component-token-exceptions.md` tracks these as 🆕). No component currently binds a
  *whole* composite token, only its individual `fontSize`/`fontWeight` pieces.

**Component height is the one dimension category that DOES have a semantic layer** — unlike
spacing(-for-components)/typography above, and unlike radius (which skips primitive entirely instead). Two
tiers, per [ADR-004](../../docs/ADR/ADR-004-size-standard.md):
- `primitive.size.{50,75,100,125,150,175,200,225,250,300,350}` — percentage scale, same `100` = `16px`
  anchor as `primitive.spacing`, kept as its own scale rather than reusing spacing's keys because "a
  control's own dimension" and "the gap around it" are different concerns.
- `semantic.size.{xs,s,m,l,xl}` → aliases `primitive.size.{100,150,200,250,300}` = 16/24/32/40/48px.
  This is ADR-004's "Control scale" (`Button`) and, via its `s`/`m`/`l` subset, its "Field scale"
  (`Input`/`Select`). `m` lands exactly on `primitive.size.200`, the scale's own anchor rung — see ADR-004
  "Choosing `m`".
- `component.button.height.*` aliases the full `semantic.size.*` ladder; `input.height.*`/
  `select.height.*` alias its `s`/`m`/`l` subset.
- `badge.height.*` and `chip.height.*` skip the semantic layer and alias `primitive.size.*` directly —
  they're ADR-004's documented per-component exceptions (a local density model, not the shared control
  ladder), which is why they don't go through `semantic.size` — but they're still real token
  references, never an unreferenced px literal.

**Size-variant tokens (`xs`/`s`/`m`/`l`/`xl`) are always a nested object, never a flat hyphenated key.**
`component.{name}.height` is `{ "s": {...}, "m": {...} }`, not `"height-s"`/`"height-m"` as sibling keys —
this matches `button.height.*`, `input.height.*`, `avatar.height.*`, `select.height.*`, and
`switch.height.*`/`width.*`/`thumb-size.*`. `badge.height.*` and `chip.height.*` used the flat-hyphenated
form until 2026-08-23; they were migrated to match everyone else once the inconsistency surfaced (Chip
itself already used the nested form for `padding-x`/`gap`/`fontSize` — only its own `height` was the odd
one out). The generated CSS var name is identical either way (`build.ts`'s `flatten()` joins every path
segment with `-` regardless of nesting depth), so this is purely an authoring-consistency rule, not
something that affects `dist/helix.css` output — but a flat hyphenated key that happens to end in a size
suffix (e.g. a hypothetical `badge.border-width-thick`) is a different, legitimate case and not what this
rule targets; it only applies where the varying part IS the size scale itself.

### Semantic naming vocabulary (decided 2026-08-21)

Formalized as a JSON Schema at `contracts/token-naming.schema.json` — the `{role}[-interactive][-modifier]
[-state]` grammar below, plus the banned-segment list, as `enum`/`pattern` constraints instead of only prose.
It validates a key's STRUCTURE (right words, right order) — it does NOT and cannot check whether a
`-light`/`-dark` modifier is correct relative to a token's siblings (e.g. whether this is genuinely the
lightest of three tones in its group), since that's a comparison across resolved values, not something a
per-key schema can see. `scripts/verify-token-naming.ts` still owns that relative check — the schema and
the script are complementary, not redundant; read the schema's own `description`/`counterExamples` fields
for the worked-through reasoning.

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

### Motion naming vocabulary (decided 2026-09-11)

Unlike color, motion values split across two homes depending on whether the destination can read a CSS
custom property at all — the naming vocabulary is shared, the storage mechanism isn't:

- **CSS-expressible values** (duration, easing, transform, and now blur) are real `tokens.json` entries
  under `semantic.*`, same as everywhere else: `semantic.duration.{instant,fast,base,slow,slower}`,
  `semantic.easing.{base,in,out,gentle}`, `semantic.transform.{lift,scale}.{s,m,l}`, and
  `semantic.blur.{enter}`. None of these have a role/modifier/state axis like color does — they're flat
  named scales (a short enum with a `$description` each), so there's no grammar schema to write for them
  the way `contracts/token-naming.schema.json` formalizes color's `{role}[-interactive][-modifier][-state]`.
  `component.*` tokens should alias one of these (`component.avatarGroup.hover.lift` →
  `{semantic.transform.lift.m}`) the same way `component.button.transition` aliases
  `{semantic.duration.base}` — never a raw px/ms/number literal at the component layer unless it's a
  documented exception (see `component.input.shake.*` below).
  - **The bar for promoting a component-scoped literal into a new shared `semantic.*` rung: 3+
    components independently landing on the identical value**, not just "this value could theoretically
    be reused someday." `semantic.blur.enter` (2px) is the worked example — Accordion, SidePanel, and
    Toast each shipped their own `blur-enter`/`blurEnter` literal, all independently tuned to 2px; once
    that convergence was real (not hypothetical), it became one token all three alias. A duration/scale
    value that's *different* per component (Modal's `scale-enter` 0.96, Tooltip's 0.98, Toast's 0.97 —
    all deliberately, independently tuned) stays a component-scoped literal — forcing those onto one
    shared number would misrepresent three different tuned feels as interchangeable.
- **JS-only values Motion (`motion/react`) consumes as plain numbers/arrays** — spring `stiffness`/
  `damping` (no CSS transition can express spring physics) and cubic-bezier arrays used as a JS
  `ease` — have no `var()` form and can never be a `tokens.json` entry (see "What NOT to do" below).
  These live in `packages/core/src/lib/motionPresets.ts` instead: named exports
  (`SPRING_SNAPPY`, `EASE_BACK`, `FAB_EXPAND_TRANSITION`, `PRESS_SCALE_DEFAULT`, ...), imported by
  every component that needs one, instead of retyped inline per call site. This is what actually
  caught real drift: Switch's thumb spring and NavItem's sliding indicator were meant to feel
  identical and had quietly diverged (`damping: 32` vs `damping: 35`, no comment explaining why) —
  exactly the "re-implemented at every call site and drifts" problem the `Icon` wrapper rule (root
  `CLAUDE.md` rule 2) already solves for icons, just for spring physics instead.
  - Where a JS-only value happens to coincide with a real duration token, derive it from
    `@helix-ds/tokens`'s generated `tokens` export instead of retyping the literal — see
    `motionPresets.ts`'s `FAB_COLLAPSE_TRANSITION` (300ms, same value as `semantic.duration.slower`,
    read via `tokens.semantic.duration.slower` rather than hardcoded as `0.3`). A value with no
    matching token (FAB's other two transitions, both bespoke-tuned) stays a literal — forcing it onto
    the scale just to look consistent would change the actual tuned feel for no reason.
- **A component-scoped motion value that used to be a bare CSS custom property with no token backing**
  (Input's error-shake — `--helix-input-shake-distance/-overshoot/-dur-a/-dur-b/-ease`, previously
  hand-declared only in `globals.css`) is now `component.input.shake.*` in `tokens.json`, same as any
  other component token. It skips `semantic.*` (no shared "shake" concept exists elsewhere) — a
  documented exception in `component-token-exceptions.md`, same category as `avatarGroup.border-width`.
- This section's JS-only half is a deliberate, narrow exception to the "What NOT to do" rule below, not
  a contradiction of it: that rule is about keeping `tokens.json`/the CSS pipeline free of values that
  can't become a real `var()` — `motionPresets.ts` is the dedicated place for exactly that category,
  outside the token file, not a backdoor into it.

## Dark mode tokens

Dark overrides are in `dist/helix.css` under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.
When adding a semantic color token that needs a dark value, add both variants.

## What NOT to do

- Don't add raw hex values to semantic tokens — always reference a primitive
- Don't add tokens for one-off component states not shared across 3+ components
- Don't add JS-only constants that don't have a CSS counterpart *to this file* — Motion's spring/
  cubic-bezier values genuinely can't be tokens.json entries; they belong in
  `packages/core/src/lib/motionPresets.ts` instead, per "Motion naming vocabulary" above
