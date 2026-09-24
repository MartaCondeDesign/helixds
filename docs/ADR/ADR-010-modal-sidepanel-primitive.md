# ADR-010 — Modal & SidePanel primitive: native `<dialog>`, JS-orchestrated close

**Date:** 2026-09-11
**Status:** Accepted
**Deciders:** Helix DS team

## Context

Neither `Modal` (a centered overlay) nor `SidePanel` (a right-edge drawer) has a single native HTML element
that alone provides their behavior, so per [ADR-001](ADR-001-primitive-foundation.md) each needs an explicit
primitive choice before implementation. Both need the same underlying mechanics — a backdrop, a focus trap,
Escape-to-close, and rendering above everything else on the page (no manual z-index stacking) — they only
differ in anatomy/position (centered + scale vs. right-edge + slide) and in which of the two pasted
reference transitions drives their enter/exit animation. One ADR covers both: the primitive decision and
its reasoning are identical for each.

Two paths considered:

1. **Radix Dialog** (or an equivalent library) — full-featured (portal, focus trap, scroll lock), but a new
   dependency duplicating machinery the browser already ships for free via `<dialog>`.
2. **Native `<dialog>` + `showModal()`** — backdrop (`::backdrop`), focus trap, Escape-to-close, and
   top-layer rendering (no z-index management) all come from the browser itself, zero dependency.

## Decision

**Native `<dialog>`, opened via `showModal()`** — not the plain `open` attribute, which gives a
non-modal, non-backdropped, no-focus-trap dialog; `showModal()` is what actually provides everything ADR-001
would otherwise require hand-rolling.

**Close is JS-orchestrated, not CSS-only** — `<dialog>` has no built-in "animate out, then actually close"
behavior, and unlike Tooltip/Accordion this component genuinely needs one: closing it for real
(`.close()`) immediately drops it from the top layer, with no way to first play an exit transition purely
in CSS in every currently-supported browser (the newer `@starting-style`/`transition-behavior:
allow-discrete` combination that solves this natively isn't broadly-supported-enough yet to be the only
path). Matches the reference snippets' own documented recipe exactly:

1. On `expanded` → `true`: call `showModal()`, then flip to a `data-state="open"` attribute on the next
   animation frame (not the same tick — a state and its transition have to land in different paint frames
   for the transition to actually play instead of snapping straight to the end state).
2. On `expanded` → `false` (or a native dismissal — Escape, `::backdrop` click, both of which fire the
   native `cancel` event): flip to `data-state="closing"`, wait the component's own close-duration token
   (read via `resolveTokenPx`, same JS/CSS bridge FAB and Switch already use for token-driven numbers,
   reused here for a duration in ms rather than a px offset — see that function's shared home), THEN call
   the real `.close()`.
3. A native `cancel` event is intercepted (`preventDefault()`) so the browser doesn't instantly close the
   dialog out from under step 2's animation — it's redirected into the same JS-orchestrated close path via
   `onDismiss`, so Escape/backdrop-click and a programmatic close animate identically.

**Shared implementation**: `packages/core/src/lib/useDialogTransition.ts` (named for the native `<dialog>`
element it wraps, not the `Modal` component) — both `Modal` and `SidePanel` use this one hook (ref +
`data-state` + the choreography above), each supplying its own close-duration token. Anatomy and the actual
enter/exit transition (scale+fade for Modal, slide+blur+fade for SidePanel) stay separate per-component
CSS — only the open/close state machine is shared. Accordion's native `<details>` hits the same "closing
needs JS timing" problem for a different element — see `useDisclosureTransition.ts`, the sibling hook for
that case.

**Prop naming**: the visibility prop is `expanded`/`onDismiss` (canonical per `.ai/maps/prop-map.md` —
`open`/`isOpen` are listed anti-synonyms of `expanded`; `onClose`/`onCancel` are anti-synonyms of
`onDismiss`), not `open`/`onClose` as the reference snippets name it.

**Naming note:** this component is called `Modal`, not `Dialog` — decided after this ADR was first drafted
under the working name `Dialog`; the primitive decision and reasoning above are unaffected by the rename.

**Backdrop (added 2026-09-24):** the `::backdrop` color is `semantic.color.fill.overlay` (via
`component.modal.overlay`), applied at `component.modal.overlay-opacity` (`0.6`) with
`color-mix(in srgb, <overlay> <opacity × 100%>, transparent)`. Same rendered color as the previous
hand-written `rgba(15,23,42,0.6)`, but the color now comes from the token (and follows it if the token
changes); only the opacity is Modal-local.

## Consequences

- **Positive:** zero new dependency; focus trap, `::backdrop`, Escape-to-close, and top-layer stacking are
  all free, correct, and consistent with native OS/browser behavior — nothing Helix has to get right by hand.
- **Positive:** one shared hook, not two copies of the same open/close choreography.
- **Negative:** relies on the `<dialog>` `cancel`/`close` events and `showModal()`/`close()` methods, not
  purely declarative markup — a small, real amount of JS, same trade-off ADR-009 already accepted for
  Tooltip's auto-placement.
- **Negative:** no `@starting-style`-based CSS-only alternative — revisit if/when that feature's browser
  support is broad enough that the JS choreography stops earning its keep.

## Contracts affected

New: `contracts/components/Modal.json`, `contracts/components/SidePanel.json`.
