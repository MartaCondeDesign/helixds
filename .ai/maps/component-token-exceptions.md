# Helix DS — Component Token Exceptions

Every `component.*` token should alias `semantic.*` where a semantic role exists for it (per
`packages/tokens/CLAUDE.md` → "Token layers"). This file lists every token that does **not** — it aliases
`primitive.*` directly, or has no alias at all (a raw literal) — plus why.

**This is not automatically a violation.** Some of these are legitimate: the category has no semantic layer
at all (typography, duration), or the component is a documented ADR-004 density exception (Badge, Chip).
Others are real gaps — a semantic token exists and simply isn't wired up yet. The "Kind" column tells you
which is which. Treat `Gap` rows as a backlog, not as acceptable precedent for new tokens.

## This file is auto-generated — do not hand-edit the tables

Every table between an `<!-- AUTO:NAME -->` / `<!-- /AUTO -->` marker pair is regenerated from
`packages/tokens/src/tokens.json` by `scripts/audit-token-exceptions.ts`. Editing a table by hand will be
silently overwritten the next time it runs. Two things stay hand-maintained:

- the prose around each table (this file's narrative context, ADR references)
- the `KNOWN_EXCEPTIONS` allowlist inside the script itself — the one place a human judgment call
  ("this is an intentional ADR-004 density exception", "this is a one-off color, not a reusable role")
  gets recorded. Everything else is inferred purely from `tokens.json`.

**Workflow — this doc updates itself:**

- Run manually any time: `pnpm docs:token-exceptions`
- Runs automatically on every commit via `.husky/pre-commit` (after `verify:tokens`) — so the moment a new
  component's tokens land in `tokens.json`, this file reflects them in the same commit, no one has to
  remember to update it by hand.
- When the auto-classifier puts a new token somewhere you disagree with (e.g. it lands in the `Gap` table
  but you've decided it's actually a deliberate exception like Badge/Chip height), add one line to
  `KNOWN_EXCEPTIONS` in `scripts/audit-token-exceptions.ts` and rerun — the doc follows.

To re-audit the classification logic itself, read `scripts/audit-token-exceptions.ts` — it replaces the old
manual re-audit one-liner that used to live in this file.

---

## Primitive-direct (no semantic layer exists for the category)

`fontWeight` has no semantic role layer in code at all, and `fontSize` only has `semantic.fontSize.mobile.*`
(responsive breakpoint overrides) — not a flat xs/s/m/l/xl role layer comparable to the primitive rungs.
Every component token in this category has nothing to route through — aliasing `primitive.*` directly is
correct, not a gap.

<!-- AUTO:NO_SEMANTIC_LAYER -->
| Component | Token | Aliases | Why |
|---|---|---|---|
| Avatar | `fontWeight` | primitive.fontWeight.semibold | No semantic.fontWeight role layer |
| Badge | `fontSize` | primitive.fontSize.xs | No semantic.fontSize role layer |
| Badge | `fontWeight` | primitive.fontWeight.semibold | No semantic.fontWeight role layer |
| Button | `fontSize.l` | primitive.fontSize.m | No semantic.fontSize role layer |
| Button | `fontSize.m` | primitive.fontSize.s | No semantic.fontSize role layer |
| Button | `fontSize.s` | primitive.fontSize.s | No semantic.fontSize role layer |
| Button | `fontSize.xl` | primitive.fontSize.l | No semantic.fontSize role layer |
| Button | `fontSize.xs` | primitive.fontSize.xs | No semantic.fontSize role layer |
| Chip | `fontWeight` | primitive.fontWeight.medium | No semantic.fontWeight role layer |
| NavItem | `fontSize` | primitive.fontSize.s | No semantic.fontSize role layer |
| NavItem | `fontWeight` | primitive.fontWeight.medium | No semantic.fontWeight role layer |
| PageHeader | `description.fontSize` | primitive.fontSize.s | No semantic.fontSize role layer |
| PageHeader | `title.fontSize.1` | primitive.fontSize.2xl | No semantic.fontSize role layer |
| PageHeader | `title.fontSize.2` | primitive.fontSize.xl | No semantic.fontSize role layer |
| PageHeader | `title.fontWeight` | primitive.fontWeight.bold | No semantic.fontWeight role layer |
| StatCard | `delta.fontSize` | primitive.fontSize.xs | No semantic.fontSize role layer |
| StatCard | `label.fontSize` | primitive.fontSize.xs | No semantic.fontSize role layer |
| StatCard | `label.fontWeight` | primitive.fontWeight.medium | No semantic.fontWeight role layer |
| StatCard | `value.fontSize` | primitive.fontSize.3xl | No semantic.fontSize role layer |
| StatCard | `value.fontWeight` | primitive.fontWeight.bold | No semantic.fontWeight role layer |
| Table | `cell.fontSize` | primitive.fontSize.s | No semantic.fontSize role layer |
| Table | `header.fontSize` | primitive.fontSize.xs | No semantic.fontSize role layer |
| Table | `header.fontWeight` | primitive.fontWeight.semibold | No semantic.fontWeight role layer |
<!-- /AUTO -->

## Primitive-direct (ADR-004 density exception — Badge/Chip height)

Badge and Chip use a local density model instead of the shared `semantic.size` ladder, per
[ADR-004](../../docs/ADR/ADR-004-size-standard.md) → "Compact/status components". Their height values
correctly alias `primitive.size.*` directly — going through `semantic.size` would put them on the
shared control ladder, which is the one thing ADR-004 says not to do here.

<!-- AUTO:ADR004 -->
| Component | Token | Aliases | Why |
|---|---|---|---|
| Badge | `height-s` | primitive.size.150 | ADR-004 density exception, not the control ladder |
| Badge | `height-xs` | primitive.size.125 | ADR-004 density exception, not the control ladder |
| Chip | `height-m` | primitive.size.200 | ADR-004 density exception, not the control ladder |
| Chip | `height-s` | primitive.size.175 | ADR-004 density exception, not the control ladder |
<!-- /AUTO -->

## Primitive-direct (dimension beyond the shared ladder's max rung)

Page-chrome bars aren't controls, so they're intentionally off ADR-004's Control scale entirely — but when
their required dimension is also past that scale's own top rung, aliasing one step further up the same
primitive scale is correct rather than inventing an unreferenced literal.

<!-- AUTO:BEYOND_LADDER -->
| Component | Token | Aliases | Why |
|---|---|---|---|
| TopBar | `height` | primitive.size.350 | Past semantic.size's top rung (xl=48px) — next rung up on the same primitive scale |
<!-- /AUTO -->

## Raw literal — no alias at all (standalone chrome dimension, no shared scale)

A page-shell chrome measurement that isn't a control height or a spacing gap — there's no t-shirt ladder or
spacing rung it conceptually belongs to. No primitive value close enough to alias instead.

<!-- AUTO:RAW_NO_SCALE -->
| Component | Token | Value | Note |
|---|---|---|---|
| SideNav | `width` | 224px | Standalone chrome dimension — no matching primitive/spacing/size rung |
<!-- /AUTO -->

## Gap — a matching `semantic.*` category exists but isn't wired up

These component tokens alias `primitive.*` directly even though `semantic.*` has a role layer for the same
category. Where the resolved value exactly matches an existing semantic rung, that rung is named — rewiring
the alias is fair game, low risk (same resolved value either way, only the alias chain changes). Where no
rung matches exactly, the gap is a decision, not a one-line fix: either the scale needs a new rung, or this
value stays primitive-direct on purpose.

<!-- AUTO:GAP -->
| Component | Token | Currently aliases | Matching semantic rung |
|---|---|---|---|
| Button | `padding.x-l` | primitive.spacing.125 | *(no matching rung — closest primitive value is 20px)* |
| Button | `padding.x-m` | primitive.spacing.100 | semantic.spacing.component-l |
| Button | `padding.x-s` | primitive.spacing.75 | semantic.spacing.component-m |
| Button | `padding.x-xl` | primitive.spacing.150 | semantic.spacing.component-xl |
| Button | `padding.x-xs` | primitive.spacing.50 | semantic.spacing.component-s |
| Button | `transition` | primitive.duration.base | semantic.duration.base |
| Card | `padding` | primitive.spacing.150 | semantic.spacing.component-xl |
| Dialog | `padding` | primitive.spacing.150 | semantic.spacing.component-xl |
| Input | `gap.description` | primitive.spacing.25 | semantic.spacing.component-xs |
| Input | `gap.label` | primitive.spacing.25 | semantic.spacing.component-xs |
<!-- /AUTO -->

## Raw literal — no alias at all

These have no `{...}` reference in `tokens.json` — not even to a primitive. Where the value numerically
matches an existing primitive, that primitive is proposed as a drop-in alias (same resolved value, no visual
change). Where nothing matches, the value is a genuine standalone measurement.

<!-- AUTO:RAW_LITERAL -->
| Component | Token | Hardcoded value | Proposed token |
|---|---|---|---|
| Checkbox | `size` | 16px | `primitive.size.100` |
| Chip | `border-width` | 1px | *(none — no matching primitive value)* |
| Chip | `fontSize.m` | 13px | *(none — no matching primitive value)* |
| Chip | `fontSize.s` | 13px | *(none — no matching primitive value)* |
| Chip | `gap.m` | 6px | *(none — no matching primitive value)* |
| Chip | `gap.s` | 6px | *(none — no matching primitive value)* |
| Chip | `padding-x.m` | 16px | `primitive.spacing.100` |
| Chip | `padding-x.s` | 12px | `primitive.spacing.75` |
| Radio | `size` | 16px | `primitive.size.100` |
| Switch | `height.m` | 20px | `primitive.size.125` |
| Switch | `height.s` | 16px | `primitive.size.100` |
| Switch | `thumb-size.m` | 16px | `primitive.size.100` |
| Switch | `thumb-size.s` | 12px | `primitive.size.75` |
| Switch | `width.m` | 36px | `primitive.size.225` |
| Switch | `width.s` | 28px | `primitive.size.175` |
<!-- /AUTO -->

## Raw literal — one-off color, not a reusable role

<!-- AUTO:ONE_OFF_COLOR -->
| Component | Token | Value | Why |
|---|---|---|---|
| Dialog | `overlay` | rgba(15,23,42,0.6) | One-off backdrop color, no reusable semantic role exists for it |
<!-- /AUTO -->
