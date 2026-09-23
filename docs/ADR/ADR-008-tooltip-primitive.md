# ADR-008 — Tooltip primitive: hand-rolled, CSS-positioned, no library

**Date:** 2026-09-11
**Status:** Accepted — the "no dynamic collision/flip logic" decision below is amended by
[ADR-009](ADR-009-tooltip-auto-placement.md); the rest (hand-rolled, no portal, no external library,
CSS-only show/hide) stands unchanged.
**Deciders:** Helix DS team

## Context

`Tooltip` has no native HTML equivalent, so per [ADR-001](ADR-001-primitive-foundation.md) it's out of
scope for "wrap a native element" and needs its own ADR and explicit primitive choice before
implementation. It's needed now as the first real consumer: `AvatarGroup` needs a name label on hover for
each avatar, and a list of the hidden names on hover of the `+N` overflow indicator.

Two paths considered:

1. **A floating-positioning library** (Radix `Tooltip`, Floating UI, etc.) — full collision detection,
   auto-flip when the tooltip would overflow the viewport, portal rendering.
2. **Hand-rolled**: a small trigger/content pair, `position: absolute` relative to a `position: relative`
   wrapper, a handful of named placements, no portal, no collision detection.

## Decision

**Hand-rolled**, following the WAI-ARIA APG tooltip pattern directly, no external dependency:

- Trigger wraps its child in a `position: relative` `span` (`data-helix-part="tooltip-root"`); the tooltip
  content (`data-helix-part="tooltip-content"`) is `position: absolute`, placed via `placement` (`top` /
  `bottom` / `left` / `right`, default `top`) with a fixed offset token — no dynamic collision/flip logic.
- Shown on `:hover` AND `:focus-within` (CSS only for the common case — a plain description tooltip needs
  no JS at all to show/hide), so keyboard users get it too, not just mouse hover. A short show delay
  (`--helix-tooltip-delay`) avoids flashing one on every incidental mouse pass, matching the APG pattern's
  "don't show instantly" guidance; hide is immediate.
- `role="tooltip"` on the content, referenced from the trigger via `aria-describedby` — content is plain
  text/inline content, not interactive (no links/buttons inside a tooltip; that's what `Popover` would be
  for, a separate, not-yet-built component).
- Dismissible with `Escape` while focused (a small `keydown` handler on the trigger, since CSS alone can't
  hear a keypress) — the one piece of JS this component needs.
- No portal: the content renders inline in the DOM where `Tooltip` is used. Fine at Helix's current scale
  (short labels, not overflowing dialogs/scroll containers where `overflow: hidden` on an ancestor would
  clip it) — revisit with a portal if a real usage hits that clipping case.

Rationale: matches ADR-001's standing preference — no primitive dependency to audit/upgrade, and a plain
description tooltip (the only use case today: a name label, a short list of hidden names) doesn't need
collision detection to be correct. Radix/Floating UI stay a real option for a *future*, more demanding
need (nested scroll containers, viewport-edge auto-flip) — this ADR doesn't rule that out permanently, it
just says the simple case doesn't justify the dependency yet.

## Consequences

- **Positive:** zero new dependency; full control over markup and `data-helix-part` anatomy, same as every
  other Helix component.
- **Positive:** CSS-only show/hide for the hover/focus path — no state management, no missed
  mouseenter/mouseleave pairing bugs.
- **Negative:** no automatic viewport-edge flipping — a tooltip placed too close to a container edge can
  render partially off-screen or get clipped by an `overflow: hidden` ancestor. Acceptable for the current
  use (short avatar-name labels inside normal page flow); a consumer placing `Tooltip` inside a scrolling
  panel near its edge should pick a `placement` that avoids the edge, or this ADR gets revisited.
- **Negative:** each new placement need is a manually-authored CSS rule, not computed — fine at 4
  placements, would get unwieldy well before 4 grows to a general "auto" mode.

## Contracts affected

New: `contracts/components/Tooltip.json`.
