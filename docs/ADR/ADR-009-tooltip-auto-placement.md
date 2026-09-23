# ADR-009 — Tooltip auto-placement: viewport collision detection

**Date:** 2026-09-11
**Status:** Accepted — amends [ADR-008](ADR-008-tooltip-primitive.md)
**Deciders:** Helix DS team

## Context

ADR-008 explicitly chose no collision detection: `placement` was a fixed side, no auto-flip, and the
consumer was expected to "pick a `placement` that avoids the edge" if a tooltip risked clipping. In
practice, this pushed the decision onto every individual usage instead of solving it once — AvatarGroup's
per-avatar name tooltip clipped against the Storybook canvas's top edge with the default `placement="top"`,
and hardcoding `placement="bottom"` on that one usage (tried first, before this ADR) doesn't generalize: any
consumer placing a `Tooltip` near *any* edge — top, bottom, left, or right, of the viewport or a scrollable
container — hits the same problem and has to know to work around it by hand. That's exactly the case ADR-008
already flagged as its own weak spot ("this ADR gets revisited").

## Decision

**`Tooltip` now auto-corrects its rendered placement to avoid clipping the viewport — the consumer's
`placement` prop is a preference, not a guarantee.** Still no portal, still no external library (Radix/
Floating UI) — ADR-008's core "hand-rolled, no dependency" call stands; only the "no dynamic collision/flip
logic" half is reversed.

- On mount, resize, and scroll (capture phase, so scrolling any ancestor container counts, not just the
  window), `Tooltip` measures the trigger's `getBoundingClientRect()` and the content's natural size — the
  content is always laid out (`visibility: hidden`, not `display: none`), so its real dimensions are
  measurable even while invisible, no need to wait for a hover/focus event first.
- **Primary-axis flip:** if the requested `placement` is `top`/`bottom` and would clip vertically, it flips
  to the other of the pair (`top`→`bottom`, `bottom`→`top`); same for `left`/`right` clipping horizontally.
  An 8px gutter from the viewport edge counts as "would clip", not just literal negative coordinates.
- **Cross-axis clamp:** independent of the flip above, the content's centered position on its cross axis
  (horizontal for `top`/`bottom`, vertical for `left`/`right`) is clamped to stay within the viewport,
  applied as a `translate` shift on top of the existing `-50%` centering — this is what actually satisfies
  "must never overflow the page" for a tooltip near a side edge while still vertically `top`/`bottom`
  placed, not just the up/down flip case.
- This is a **flip + clamp** strategy, not full Floating UI-style placement solving (no auto-switching
  between the vertical and horizontal axis, e.g. `top` clipping both up and down never falls back to
  `left`/`right` — that combination is rare enough at Helix's current scale, short single-line/short-wrap
  labels, that it wasn't worth the added complexity; revisit if a real usage hits it).
- Show/hide is **still CSS-only** (`:hover`/`:focus-within`, unchanged from ADR-008) — the new measurement
  logic is orthogonal to visibility and runs regardless of whether the tooltip is currently shown.

## Consequences

- **Positive:** no per-usage workaround needed — `AvatarGroup`'s per-avatar tooltip and the Tooltip
  Storybook stories go back to the component's real default (`placement="top"`) instead of every consumer
  having to pre-guess a safe side.
- **Positive:** still zero new dependency, still no portal — the auto-placement math is ~30 lines, not a
  reason to adopt Floating UI on its own.
- **Negative:** `Tooltip` now does real JS work (two `getBoundingClientRect()` calls, `resize`/`scroll`
  listeners) instead of being purely declarative CSS + one `keydown` handler — a small but real complexity
  increase ADR-008 had deliberately avoided taking on for "the simple case."
- **Negative:** the flip+clamp strategy doesn't solve the full general case (a trigger with no room on
  either axis) — accepted for now, see the "flip + clamp" note above.

## Contracts affected

`contracts/components/Tooltip.json` — `placement` prop description updated: it's now a starting preference
Tooltip may override, not a hard guarantee.
