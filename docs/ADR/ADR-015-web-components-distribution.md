# ADR-015 — Web Components distribution: Lit, Shadow DOM, four-component pilot

> Package names updated to the `@helixds` npm scope (ADR-023, 2026-10-07); this ADR was written when they were `@helix-ds/…`.

**Date:** 2026-09-14
**Status:** Proposed
**Deciders:** Helix DS team

## Context

Helix ships as a single distribution: `@helixds/react`, React 19 components on native HTML + Tailwind
v4. `@helixds/tokens` was already framework-agnostic before this ADR — `dist/helix.css` is plain
`:root { --helix-*: ...; }`, with no React or Tailwind dependency in the token package itself
(Tailwind is wired in one layer up, inside `packages/core/src/globals.css`). Nothing about the tokens
needs to change to be consumed outside React.

The components themselves do need a real second implementation to be consumable outside React — there
is no mechanical way to run a React component tree in a Vue/Angular/plain-HTML page. This is not a new
problem for design systems generally (see `weave-ds-template`'s four-backend approach, evaluated in a
separate conversation), but it is new for Helix, and it's exactly the category of decision root
`CLAUDE.md` rule 4 and `ADR-001` already flag as needing its own ADR before implementation: a new
rendering target, not an extension of the existing one.

## Decision

**A new package, `packages/wc` (`@helixds/wc`), built with Lit, using real Shadow DOM.** Not vanilla
Custom Elements — components in this library already include real interaction logic (`Tooltip`'s
auto-placement math, `Select`'s hand-rolled listbox keyboard nav per ADR-013) that would mean
hand-writing a reactive re-render cycle per component; Lit (~5kb) solves that once instead of per
component, at the cost of one dependency scoped only to this package. Shadow DOM (not Light DOM) for
real style encapsulation from the host page — the trade-off accepted: `packages/core/src/globals.css`'s
`[data-helix-part]` rules cannot be reused as-is, since they don't cross the shadow boundary; each
component's relevant CSS block is ported into that component's own Lit `static styles`, referencing
`var(--helix-*)` directly. Tokens themselves need no porting — CSS custom properties inherit through
Shadow DOM natively, so a consumer only needs `@helixds/tokens/helix.css` loaded once on the page.

**A four-component pilot — `Icon`, `Badge`, `Button`, `Tooltip` — not a port of all 149 components.**
Chosen to span the complexity tiers actually found in `packages/core`: `Badge` (stateless, validates
baseline plumbing), `Icon` (needed by the other three; the interop story is genuinely different from
React's — see below), `Button` (replaces `motion/react`, a React-only dependency, with a CSS `:active`
transition for the press-scale effect ADR-007 gives React via Motion), and `Tooltip` (the hardest case:
no native HTML equivalent per ADR-001/ADR-008, hand-rolled positioning ported from `useAutoPlacement`
(ADR-009) to plain `ResizeObserver`/scroll/resize listeners, and a real Shadow DOM accessibility problem
— see below). Whether to scale beyond these four is an explicit follow-up decision, made after this
pilot is reviewed, not assumed here.

**`Icon`'s interop model changes for Web Components — it is not the React adapter from ADR-014.** A
Custom Element cannot receive a live component reference as a prop the way React can (`icon={IconPlus}`
has no Custom-Element equivalent). `<helix-icon>` instead wraps a default `<slot>`: the consumer places
their own inline `<svg>` (from Tabler, another set, or hand-authored) as light-DOM content, and the
element applies size/color via `::slotted(svg)` CSS and reflects `aria-hidden`/`role`/`aria-label` onto
the host element. This is documented as a real, deliberate difference from `@helixds/react`'s adapter
pattern, not an oversight — the two distributions solve the same interop goal through the mechanism
each framework actually offers.

**`Tooltip`'s description text is rendered in light DOM, slotted into the shadow root for
positioning/styling — not created inside the shadow root outright.** `aria-describedby` is an ID
reference, and ID references do not reliably cross a shadow boundary from a light-DOM element (the
slotted trigger) into a *different* element's shadow tree across browsers today. `<helix-tooltip>`
therefore creates its content node as a real light-DOM child of the host element (same tree as the
slotted trigger), gives it an id, sets `aria-describedby` on the trigger pointing at that id, and
projects the node into the shadow root via a named `<slot>` purely for CSS positioning — the ID
reference resolves entirely within the light DOM, where both elements actually live.

## Consequences

- **Positive:** Helix becomes consumable outside React for the piloted components, without asking
  consumers to change how they load tokens — `@helixds/tokens/helix.css` already works.
- **Positive:** the pilot surfaces the two hardest structural questions (foreign icon interop without a
  component-reference mechanism; ARIA references across a shadow boundary) before committing to a
  49-times-larger effort of porting the full library.
- **Negative:** every future component needs its CSS re-authored into `static styles`, not just
  referenced from `globals.css` — real, ongoing duplication between the two distributions until/unless
  a shared CSS-authoring layer is built, which this ADR does not attempt.
- **Negative:** Shadow DOM means a consumer cannot override internal component styling with plain
  page-level CSS (only via the `--helix-*` custom properties, or `::part()` if added later) — a real,
  accepted trade-off of real encapsulation, not a gap to close casually.
- **Negative:** `motion/react`'s spring-based press animation is not reproduced exactly — the WC
  `Button` uses a CSS `:active` transition instead, which is visually close but not physics-identical.

## Contracts affected

None amended — `contracts/components/{Icon,Badge,Button,Tooltip}.json` describe component intent
agnostic of framework already; no contract field is React-specific enough to need a Web-Components-only
addition. `contracts/manifest.json` gains an additive `wcImplementation` field (null for every component
without one) via `scripts/generate-component-manifest.ts`.
