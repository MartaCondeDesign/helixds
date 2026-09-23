# ADR-012 — SegmentedControl primitive: hand-rolled radiogroup, shared sliding-indicator pattern

**Date:** 2026-09-12
**Status:** Accepted
**Deciders:** Helix DS team

## Context

`SegmentedControl` (the Plan/Debug/Ask pill switcher) has no single native HTML equivalent once it's built
from `<button>` elements rather than real `<input type="radio">`s — unlike `RadioGroup`/`RadioButton`, which
wrap native radio inputs and so needed no ADR. A button-based pill switcher needs hand-rolled ARIA and
keyboard behavior, which per [ADR-001](ADR-001-primitive-foundation.md) requires its own ADR and explicit
primitive choice before implementation. Approved via a throwaway HTML/CSS/JS preview before this ADR was
written.

## Decision

**`role="radiogroup"` / `role="radio"` + `aria-checked`, not `tablist`/`tab`.** The reference snippet this
was adapted from ("Transitions.dev — Tabs sliding") used real ARIA tabs, which imply an associated
`tabpanel` whose content changes with selection. Helix's actual use case (Plan/Debug/Ask) is a pure mode
switcher with no associated panel — `radiogroup`/`radio` is the correct pattern per WAI-ARIA Authoring
Practices for "choose exactly one option from a small visible set," matching `RadioGroup`'s own semantics
even though the markup underneath is buttons, not inputs.

**Roving tabindex + arrow-key navigation, hand-rolled** — since this isn't a native radio input group, the
component manages `tabIndex` (0 on the checked item, -1 on the rest) and arrow-key handling itself, the same
responsibility the browser gives away for free with real `<input type="radio">` (which is why `RadioGroup`
never needed this).

**The sliding pill reuses `NavItem`'s exact technique — Motion's `layoutId` + the shared `SPRING_SNAPPY`
preset from `motionPresets.ts`** — not the reference snippet's manual `offsetLeft`/`offsetWidth`
measurement + CSS transition. This was explicit direction: reuse the animation approach already established
for "a highlight that slides between siblings" (`NavItem`'s active indicator, `Switch`'s thumb) rather than
inventing a new one. Each `SegmentedControl` instance gets its own `layoutId` (scoped by a generated id), so
multiple instances on one page never cross-animate.

**Height is `semantic.size.s` (24px)** — first shipped at `semantic.size.m` (32px, matching `Button`'s
default height and `Input`/`Select`'s default field height) per direct request ("debe tener el mismo tamaño
que el button, 32px"), then revised down one rung on the same shared ladder after review — still a real
token off the standard scale, not a new one-off value, just a smaller approved rung (`xs`/**`s`**/m/l/xl).

**No new color tokens** — track background is `semantic.color.fill.secondary-interactive-default` (already
used for secondary button backgrounds), the pill is `semantic.color.fill.page`. No box-shadow on the pill —
[ADR-005](ADR-005-elevation-policy.md) reserves shadow for surfaces that float above content (Dialog,
Tooltip, Popover, Menu); a segmented control's pill sits flush in its own track, it doesn't float.

## Consequences

- **Positive:** the sliding-indicator implementation is now shared code (`SPRING_SNAPPY`, the `layoutId`
  pattern), not a third divergent copy alongside `Switch` and `NavItem`.
- **Positive:** no new tokens beyond `component.segmentedControl.*` aliases of existing `semantic.*` values
  — nothing to reconcile with the dark-mode `darkOverrides` map beyond what already exists for
  `fill.secondary-interactive-default` and `fill.page`.
- **Negative:** unlike `RadioGroup`, arrow-key roving and `aria-checked` bookkeeping are hand-rolled and
  need their own test coverage — the browser doesn't give this one away for free.

## Contracts affected

New: `contracts/components/SegmentedControl.json`.
