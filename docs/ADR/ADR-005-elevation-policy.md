# ADR-005 — Elevation policy: shadow reserved for overlay surfaces

**Date:** 2026-08-23
**Status:** Accepted

## Context

Helix's visual language is flat, not skeuomorphic. Before this decision, `Card` (and by composition
`StatCard`) carried a `box-shadow` (`component.card.shadow` → `semantic.shadow.s`) purely as a decorative
"lift" — the same visual weight regardless of whether the surface actually floats above other content. This
made inline content (a dashboard widget grouping other components) read as elevated the same way a genuinely
floating surface (a menu, a tooltip) would, with no way to tell them apart at a glance.

## Decision

**Shadow is reserved for surfaces that visually float above other content** — an element that overlaps or
overlays the layout beneath it, not one that sits inline within it. Concretely:

- **Gets a shadow:** Dialog, Tooltip, Popover, Menu, and any other overlay/portal-rendered surface — these
  aren't implemented yet (see [ADR-001](ADR-001-primitive-foundation.md) — each needs its own ADR and
  primitive choice before implementation), but `component.dialog.shadow` stays reserved in `tokens.json`
  for when Dialog is built.
- **Never gets a shadow:** Card, and anything that composes Card (StatCard, and any future dashboard-widget
  pattern) — these are inline content groupings, not overlays. Definition comes from `fill` + `border` only.
- **Not affected by this rule:** `component.input.shadow.focus` — a focus-ring glow, not an elevation
  shadow. Different concept, same CSS property; keep as-is.

`Card.fill` moves from `{semantic.color.fill.surface}` (`#f8fafc`, a light gray) to
`{semantic.color.fill.page}` (`#ffffff`, pure white) in the same change — with no shadow to separate it
from the page, a gray fill read as a dim, undefined smudge rather than a deliberate flat surface. White
fill + a 1px `border` is what actually reads as "a card" without elevation doing the work.

## Consequences

- **Positive:** A shadow anywhere in the UI now reliably means "this floats above the layout" — no more
  guessing whether a shadowed box is a modal or just a grouped widget.
- **Positive:** `Card`/`StatCard` read as flat, consistent with the rest of Helix's visual language.
- **Negative:** Any layout that relied on Card's shadow for visual separation from a similarly-colored page
  background now depends entirely on the border + whatever spacing surrounds it — worth a visual check on
  existing patterns/pages that nest Card on a non-white ancestor background.
- **Enforcement:** `contracts/components/Card.json`'s `tokenPolicy.allowed` no longer lists `shadow` —
  `scripts/verify-contract.ts` will flag a future attempt to reintroduce it via a token reference in Card's
  contract. `component.card.shadow` was removed from `tokens.json` outright (not deprecated in place) —
  there's no reading of "Card's shadow" that stays valid after this decision.
