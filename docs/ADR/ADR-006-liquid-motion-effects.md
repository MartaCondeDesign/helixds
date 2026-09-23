# ADR-006 — Liquid motion effects: adopting `liquid-gooey`

**Date:** 2026-09-09
**Status:** Superseded by [ADR-007](ADR-007-motion-engine.md) — `liquid-gooey` was replaced with Motion the
same day, after real debugging cost (blur/contrast tuning, a blob-radius measurement bug, the `shadow`
resolution workaround) outweighed what its SVG-filter approach bought over a mature animation library for
FAB/Switch/table-drag. Kept here for the historical reasoning; don't use this ADR to justify reintroducing
`liquid-gooey` without reading ADR-007 first.

## Context

Three components needed a motion capability Helix had no answer for: a FAB speed-dial that merges/splits
its actions (Morph), a Switch thumb that trails like liquid rubber instead of sliding flatly (Move), and a
draggable element that bows with velocity (Bend). CSS transitions and `@keyframes` (the only motion
primitives Helix has today — `semantic.duration.*`/`semantic.easing.*`) can't produce a gooey merge/split or
a velocity-reactive bend; that needs an SVG-filter silhouette layer computed in JS.

Three external candidates were evaluated for this (`Monocharts`, `morphicons`, `liquid-gooey`). The first
two failed on inspection: `Monocharts`' chart components hardcode hex colors, arbitrary-value radii, and
box-shadows on flat surfaces (violates rule 3 and ADR-005 outright); `morphicons` needs icon *data*
(`IconNode`), not the `@tabler/icons-react` component references Helix's `Icon` wrapper is built around, so
it can't drive Helix icons without an extra data-package dependency and a second source of truth for the
same icon set.

`liquid-gooey` (npm `liquid-gooey`, source `github.com/Jakubantalik/Libraries`) is the one that's actually
compatible with how Helix already works:

- Its `fill` prop is applied as a real CSS custom property (`style={{ fill }}` on an SVG `<g>`), so
  `var(--helix-color-*)` resolves natively in the browser — no rewriting, no resolution step.
- Its `shadow` prop is fully optional and costs nothing when omitted (`parseShadow(undefined)` returns `[]`
  immediately) — compatible with ADR-005's flat-by-default policy without any extra work on components that
  should never have one.
- Zero runtime dependencies beyond React (`>=18`, satisfied by Helix's React 19), MIT license.

**Known risk, accepted anyway:** the package is young (~5 weeks old as of this decision), maintained
essentially by one person, and still iterating fast (already at 1.7.x-equivalent minor bumps). This is a
real bus-factor risk for a design system meant to last — pin the exact version, don't range-bump casually,
and re-evaluate at the next major if the project goes quiet.

## Decision

`liquid-gooey` is the single sanctioned vendor for gooey/liquid motion in Helix. Two hard rules apply to
every usage, everywhere, no exceptions:

1. **`fill` is always a `--helix-color-*` token reference** (`fill="var(--helix-color-fill-primary-
   interactive-default)"` or a component-level alias like `var(--helix-fab-fill-default)`), never a literal
   hex or rgba string — same rule as every other color in Helix (rule 3 in the root contract).
2. **`shadow` is only ever passed where [ADR-005](ADR-005-elevation-policy.md) already permits shadow**
   (Dialog, Tooltip, Popover, Menu, and now FAB — see that ADR's amendment), and only as a **resolved
   literal `box-shadow` string**, never a `var(...)` reference. `liquid-gooey`'s `parseShadow()` is a plain
   JS regex parser over literal `box-shadow` syntax (`LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)(px)?$/` — it doesn't
   recognize `var(--x)` as a length) — it does not resolve CSS custom properties itself. Resolve the token
   via `getComputedStyle(document.documentElement).getPropertyValue('--helix-...')` (see
   `packages/core/src/lib/resolveTokenPx.ts` for the shared helper used by FAB and Switch) and pass the
   resolved string. On every component **not** in that allow-list, omit `shadow` entirely — don't pass
   `"none"` or an empty string, just don't set the prop.

**Reduced motion needs no action from us** — unlike some motion libraries, `liquid-gooey` calls
`prefers-reduced-motion` itself (`useReducedMotion()`, wired into every item's spring resolution via
`resolveTransition()`) and degrades every transition to `{ duration: 0, easing: 'linear' }` automatically
when the OS setting is on. There is no `reducedMotion` prop to pass and nothing to opt into — this was
double-checked by reading `hooks.ts`/`GooeyItem.tsx` directly rather than assumed from another library's API
shape (an earlier draft of this ADR wrongly imported that requirement from `morphicons`, a different
package evaluated in the same session — `morphicons` does need an explicit `reducedMotion="user"` opt-in;
`liquid-gooey` does not, and passing such a prop to it would do nothing since `GooeyProps` doesn't declare
one). Still worth a manual check per usage (devtools → Rendering → emulate `prefers-reduced-motion: reduce`)
since "the library claims to handle it" and "it actually degrades this specific usage cleanly" are different
levels of confidence.

See [`.ai/maps/patterns/liquid-effects.md`](../../.ai/maps/patterns/liquid-effects.md) for the approved
component↔effect table and the full usage checklist.

## Consequences

- **Positive:** FAB's Morph, Switch's Move, and the Bend drag spike all get token-correct, accessible motion
  without hand-rolling SVG filters three separate times.
- **Positive:** the two hard rules above are mechanically checkable in review (grep for `fill="#`/`fill='rgb`
  or a bare `shadow="var(` on any `<Liquid>`/`<Gooey>` usage — either is an automatic reject) even though no
  script enforces them yet.
- **Negative:** a new, young, single-maintainer dependency. Pin the exact version in
  `packages/core/package.json`; don't let it range-drift silently through a routine `pnpm install`.
- **Negative:** `shadow`'s resolve-via-`getComputedStyle` requirement is an extra step every future usage
  must remember — there's no compiler/lint check for "you passed a raw `var()` string to `shadow`" today.
