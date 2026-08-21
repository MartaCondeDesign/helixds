# ADR-001 — Native HTML elements as the primitive layer

**Date:** 2026-08-21
**Status:** Accepted
**Deciders:** Helix DS team

## Context

The original version of this ADR (2026-08-18) decided to build on shadcn/ui (Radix UI primitives,
copy-to-project model). That decision was never carried out: no shadcn primitive was ever installed,
and every component (Button, Input, Select, Checkbox, Switch, RadioGroup, etc.) was implemented directly
on native HTML elements with hand-written ARIA. This revision replaces the original decision with the
approach actually in use.

## Decision

Build Helix components directly on **native HTML elements** (`<button>`, `<select>`,
`<input type="checkbox">`, `<input type="radio">`, etc.), adding WAI-ARIA attributes by hand only where
the native element doesn't already cover the interaction (e.g. `aria-describedby`, `aria-invalid`,
`role="alert"`).

Rationale:
- **No primitive dependency to own or update:** nothing to audit, cherry-pick, or keep in sync with an external library.
- **Native elements are accessible by default:** `<select>`, `<input type="checkbox">`, `<input type="radio">`, `<button>` ship with correct keyboard handling, focus management, and screen-reader semantics — no library needed for these.
- **Simplicity:** one less abstraction layer between markup and styling; `data-helix-part` attributes attach directly to the real DOM node.

**Scope limit:** this decision covers components that have a native HTML equivalent. Components with
**no native equivalent** — Dialog, Popover, Menu, Combobox, Tooltip, and similar — are out of scope here.
Hand-rolling keyboard/focus/ARIA for those patterns is high-risk; each one needs its own ADR and an
explicit primitive choice (Radix or otherwise) before implementation.

`Button` no longer depends on `@radix-ui/react-slot`; it always renders a real `<button>`. The polymorphic
`asChild` prop (rendering Button as a link via Radix Slot) was removed — link-styled controls should use a
plain `<a>` styled separately rather than a native-element wrapper trying to render as two different tags.

## Consequences

- **Positive:** zero external primitive dependency to install, audit, or upgrade.
- **Positive:** full control over markup — no fighting a library's DOM structure to attach `data-helix-part`.
- **Negative:** ARIA correctness for every component is entirely the DS team's responsibility — no upstream WAI-ARIA-pattern guarantee.
- **Negative:** each new component needs someone who knows the relevant ARIA pattern; mistakes ship silently unless caught in review or accessibility testing.
- **Mitigation:** accessibility review (manual + automated, e.g. axe) is required before any component contract is marked stable. Non-native-equivalent components require their own ADR and primitive choice before implementation.

## Contracts affected

All component contracts in `contracts/components/` — this revision replaces the shadcn/ui foundation
assumption made in the original version of this ADR.
