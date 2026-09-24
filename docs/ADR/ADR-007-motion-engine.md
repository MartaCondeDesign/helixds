# ADR-007 — Motion engine: `liquid-gooey` replaced with Motion

**Date:** 2026-09-09
**Status:** Accepted — supersedes [ADR-006](ADR-006-liquid-motion-effects.md)

## Context

ADR-006 adopted `liquid-gooey` for FAB's Morph speed-dial, Switch's Move thumb, and a Bend drag-reorder
spike. In practice, the SVG-filter approach caused a long, expensive debugging tail: `blur`/`contrast`
tuning that couldn't simultaneously give "visible gooey character mid-motion" and "zero connection at an
8px resting gap" at this control's scale; a real bug where the goo blob's shape was measured from the
wrong wrapper element (no `border-radius`) and rendered as a visible rectangle behind rounded Chips;
`shadow` needing a `getComputedStyle`-resolved literal because the library's own `parseShadow()` couldn't
read a CSS custom property; and the underlying bus-factor risk ADR-006 already flagged (single maintainer,
~5 weeks old at adoption) never went away.

None of that is inherent to "animating things" — it's specific to a young, narrow, SVG-filter-based gooey
library. Motion (the modern package, formerly Framer Motion) is mature, has a large community, and —
concretely, checked against its own docs rather than assumed — supports exactly what this repo needed:
spring-based `animate`/`transition` for simple position/scale motion (Switch, FAB), and a native
`Reorder.Group`/`Reorder.Item` API with an `as` prop that explicitly supports rendering as `tr`/`tbody`,
which sidesteps the CSS table box-generation problem `liquid-gooey`'s `<div>`/`<span>` wrappers ran into.

**What's given up:** the literal gooey silhouette merge (two shapes blending into one blob via an SVG
filter) has no Motion equivalent — Motion animates transform/opacity/color of individual elements, it
doesn't blend SVG silhouettes. FAB's speed-dial and the (since-removed) Chip-dismiss-merge experiment both
lose that specific visual character; FAB's actions now fade/scale/slide in and out instead of morphing out
of the trigger's shape.

## Decision

**Motion (`motion` on npm, imported from `motion/react`) is the sanctioned animation engine going forward**,
replacing `liquid-gooey` everywhere it was used:

- **Switch** — thumb position via `motion.span` + spring `animate`/`transition`, no more SVG group.
- **FAB** — action buttons via `AnimatePresence` + `motion.button` (`initial`/`animate`/`exit`, spring/
  cubic-bezier transitions matching the same two curves ADR-006's tuning arrived at — the "back" ease on
  expand, no-overshoot ease on collapse); the trigger's own squish-and-release bounce via `motion.button`
  `animate={{ scale }}`.
- **Table/Card drag-reorder** (the Bend spike) — Motion's native `Reorder.Group`/`Reorder.Item`, replacing
  the hand-rolled `useDragReorder`/`BendItem` Pointer Events spike entirely (deleted). `as="tr"`/`as="tbody"`
  render real table elements, so no more DOM-layout workaround is needed for table rows.

**Two rules carry over unchanged in spirit, changed in mechanism:**

1. **Reduced motion is NOT automatic** — checked against motion.dev's own accessibility docs, not assumed
   (the previous engine actually did handle this automatically; this one doesn't, and assuming otherwise a
   second time would repeat the exact mistake ADR-006 made once already). Every component using Motion
   scopes its own `<MotionConfig reducedMotion="user">` locally around its animated elements — never relies
   on the consuming app having wrapped its root in one, since a shared component can't assume that setup
   exists.
2. **`shadow` is now trivial** — a plain CSS `box-shadow: var(--helix-fab-shadow)` in `globals.css`. The
   `getComputedStyle`-resolution hack (`resolveToken` in `resolveTokenPx.ts`) existed only because
   `liquid-gooey`'s `parseShadow()` couldn't read a custom property; a real CSS property always could. That
   function has been removed; `resolveTokenPx` (returning a number, for Motion's numeric `animate.y`/`x`)
   stays, still needed for FAB's speed-dial offsets and Switch's thumb position.

See [`.ai/maps/patterns/motion-effects.md`](../../.ai/maps/patterns/motion-effects.md) (renamed from
`liquid-effects.md`) for the current component↔effect table and usage checklist.

## Consequences

- **Positive:** far less debugging surface — Motion's spring/tween system is deterministic and doesn't
  depend on SVG filter tuning that varies with element size and resting gap.
- **Positive:** `Reorder`'s `as` prop is a real, documented escape hatch for semantic elements — no more
  hand-rolled fallback logic for table rows.
- **Positive:** no more single-maintainer, ~2-month-old dependency risk for the animation engine itself.
- **Negative:** the literal gooey blob-merge visual is gone. If that specific look is wanted again for a
  future component, `liquid-gooey` (or an equivalent SVG-filter library) would need to be re-evaluated on
  its own merits for that one use case — Motion is not a drop-in replacement for that specific effect.
- **Negative (carried over from ADR-006, not resolved by this decision):** none of Table/Card/Chip's real
  contracts are touched by drag-reorder — it remains a Storybook-only pattern (now via `Reorder`, not the
  old spike), same status as before.

## Amendment 2026-09-24 — tuned one-off CSS motion constants

Not every animation in Helix goes through Motion: `Input`'s error shake is a CSS `@keyframes` that plays
once when a field turns `invalid`. Its easing aliases `semantic.easing.gentle` and its first phase uses
`semantic.duration.fast`, but two values stay component-local literals — `component.input.shake.distance`
(`6px` travel) and `component.input.shake.dur-b` (`60ms` return phase). They're tuned for this one gesture,
with no shared cross-component concept to alias (same reasoning as Toast's/Tooltip's tuned constants in
ADR-011/ADR-008). If a second component ever needs a shake, promote them to `semantic.*` instead.
