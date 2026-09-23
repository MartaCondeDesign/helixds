# ADR-016 — Accordion disclosure timing: one shared duration across chevron, height, and content

**Date:** 2026-09-14
**Status:** Accepted
**Deciders:** Helix DS team

## Context

`Accordion` ships with three separate duration tokens — `component.accordion.duration-expand`,
`duration-collapse`, `duration-chevron` — each a raw `250ms` literal with no backing ADR, flagged
🆕 by `pnpm docs:token-exceptions` (no `semantic.duration.*` rung matches 250ms, and no document
explained why three separate tokens all happen to share one value). Unlike Toast/Modal/Tooltip,
which each have their own primitive ADR (ADR-008/ADR-010/ADR-011) explicitly discussing their tuned
motion constants, Accordion had none — this was a real governance gap, not just an unreviewed token.

`Accordion.tsx`'s `useDisclosureTransition` hook and `globals.css` show these three tokens are not
three independent tuning decisions that coincidentally match — `duration-expand`/`duration-collapse`
drive the panel's height + opacity + filter transition, and `duration-chevron` drives the chevron's
rotation, and both are set to the same value so the chevron finishes rotating at the exact moment the
panel finishes expanding or collapsing.

## Decision

**Accordion's chevron rotation and panel expand/collapse share one duration (`250ms`) by design, kept
as three separate component tokens rather than merged into one.** They stay separate (not consolidated
into a single `component.accordion.duration`) because the panel and the chevron are visually distinct
parts that could legitimately diverge in a future redesign — collapsing them into one token would make
that future change a rename instead of a value edit, and would obscure in `globals.css` which CSS
property each duration is actually driving. Their values match today because the synchronized-finish
effect is the actual design intent, not because they're forced to be identical.

`250ms` doesn't map to `semantic.duration.*`'s five rungs (`instant`/`fast`/`base`/`slow`/`slower` =
0/80/120/200/300ms per `primitive.duration.*`) — it sits deliberately between `slow` (200ms) and
`slower` (300ms), tuned for a disclosure panel: fast enough to not feel sluggish on repeated
open/close, slow enough that the height change reads as a smooth reveal rather than a snap. This
follows the same category of decision already established for Toast/Modal/Tooltip's own tuned
constants (`packages/tokens/CLAUDE.md`'s "Motion naming vocabulary" section) — a value that's
different per component stays a component-scoped literal, and three tokens on one component landing
on the identical value on purpose doesn't meet the cross-*component* convergence bar (3+ independent
components) that would warrant promoting it to a new shared `semantic.duration.*` rung.

## Consequences

- **Positive:** the chevron-panel sync behavior is now a documented, intentional decision instead of
  an unexplained coincidence a future edit could silently break by changing only one of the three.
- **Positive:** closes a real governance gap — every other component with tuned, off-scale motion
  constants (Toast, Modal, SidePanel, Tooltip) had an ADR backing its `KNOWN_EXCEPTIONS` entry;
  Accordion now does too.
- **Neutral:** no code or token value changes — this ADR documents existing, shipped behavior.

## Contracts affected

None. `.ai/maps/component-token-exceptions.md`'s `KNOWN_EXCEPTIONS` map (in
`scripts/audit-token-exceptions.ts`) gains `accordion.duration-expand`/`duration-collapse`/
`duration-chevron` entries citing this ADR, turning their row from 🆕 to ✅.
