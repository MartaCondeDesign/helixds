# ADR-011 — Toast primitive: imperative API, portal, JS-measured stacking

**Date:** 2026-09-11
**Status:** Accepted
**Deciders:** Helix DS team

## Context

`Toast` has no native HTML equivalent (unlike `Modal`/`SidePanel`, which found one in `<dialog>`), so per
[ADR-001](ADR-001-primitive-foundation.md) it needs its own ADR and explicit primitive choice before
implementation. It's a Sonner-style stacking notification, fixed to the top-right corner, approved via a
throwaway HTML/CSS/JS preview (not React) before this ADR was written — see that preview's own iteration
history for the concrete bugs it caught before they reached real code.

## Decision

**Imperative API, a single `toast` object** — `toast.success(label, description?)`,
`toast.info(...)`, `toast.warning(...)`, `toast.danger(...)`, `toast.neutral(...)`, each returning an id;
`toast.dismiss(id)` removes one early. This is the Sonner/react-hot-toast pattern: calling
`toast.success('Saved')` from anywhere (an event handler, a fetch `.then()`, outside any component) is what
this need actually looks like in practice — a component you'd have to render conditionally yourself at the
call site doesn't fit "fire and forget" notifications the way it fits Modal/SidePanel (which are genuinely
tied to a piece of UI state the consumer already owns).

**A separate `ToastViewport` component renders the actual stack** — mounted once, wherever a consuming app
wants (typically near its root, e.g. inside `AppShell`). The imperative `toast.*` calls and the rendered
stack are decoupled through a plain module-level store (subscribe/emit, no React context) so `toast.*` works
even before `ToastViewport` has mounted, or from code with no access to a context at all.

**Portal to `document.body`** — `ToastViewport` renders via `createPortal`, so a toast fired from deep in a
component tree still stacks correctly above everything else on the page, the same reasoning `<dialog>`'s
top-layer gives Modal/SidePanel for free (Toast has no such native mechanism, so this is the hand-rolled
equivalent).

**Stacking depth is measured in JS, not computed from `%`** — the approved preview's own iteration caught
this: an early version positioned depth-2 at `translateY(200%)` (twice ITS OWN height), which broke the
moment two toasts had different heights (a 2-line description vs. a 1-line one) — depth 2 only knew its own
(shorter) height, not the taller depth-1 banner actually sitting above it, so it undershot and overlapped.
The real component measures each toast's `offsetHeight` (unaffected by its own collapsed-state `scale()`,
unlike `getBoundingClientRect()`) and accumulates real pixel offsets for the hover-spread state — same
category of fix as Accordion's move from `grid-template-rows: fr` to a JS-measured `height`.

**Depth grows downward, not upward** — the viewport is pinned to the top-right corner, so stacking upward
would push older toasts off-screen. Same "must stay inside the visible page" principle
[ADR-009](ADR-009-tooltip-auto-placement.md) already established for Tooltip's auto-placement, applied here
to a fixed viewport instead of a per-trigger tooltip.

**Color lives only on the icon — the card itself never tints per variant.** Explicit direction, and a
deliberate difference from Badge's own visual language: background is always `semantic.color.fill.page`,
title text is always `semantic.color.text.neutral`, description is always `semantic.color.text.neutral-light`
— none of that varies by variant. Only the icon (a real Filled Tabler icon per variant — `IconInfoCircleFilled`
neutral/info, `IconCircleCheckFilled` success, `IconAlertTriangleFilled` warning,
`IconAlertHexagonFilled` danger, all through the `Icon` wrapper) carries the semantic color.

**Amendment (2026-09-12): own icon-color token family, no longer shared with Badge.** Originally shipped
reusing Badge's exact `--helix-badge-icon-{variant}` tokens. Split into `component.toast.icon.*` once it
became clear the two components have genuinely different constraints: Badge's own fill is a saturated
colored background in dark mode (every variant, not just danger — `#991b1b` for danger, `#075985` info,
`#166534` success, `#92400e` warning), which forces its icon/text to a pale tone to keep 3:1+ contrast
against it. Toast's background is always the plain `fill.page` tone regardless of variant, so its icon can
go meaningfully darker/more saturated in dark mode without that constraint — sharing one token forced Toast
into Badge's paler compromise for no reason. Light-mode values are unchanged (identical to Badge's, verified
already comfortably passing contrast on white); only the dark-mode override per variant differs now. See
`packages/core/src/components/Badge/Badge.tsx` for the icon/text-must-match-fill reasoning that doesn't
apply here.

**Auto-dismiss, hover-to-pause, max visible depth** — a toast dismisses itself after
`component.toast.autoDismissMs` unless the pointer is over it (timer cleared on `mouseenter`, not
restarted on `mouseleave` — matches the approved preview). **Amendment 2026-09-29:** keyboard focus
entering a toast (`focusin`) stops its timer the same way, and focus inside the viewport spreads the stack
like hover does — closing the open item about hover having no keyboard equivalent (WCAG 2.2.1). Depth caps at 3 visible; anything past that plays
the leaving transition and is removed, same as a 4th banner in the original reference snippet.

**Tuned constants, not tokens — `durationOpen` (350ms), `durationClose` (250ms), `autoDismissMs` (4000ms),
`scaleEnter` (0.97), `depthScale` (0.06), `depthFade` (0.4), `rise` (80px).** Each is a literal, not a
`semantic.*` alias, and stays that way deliberately — same reasoning `packages/tokens/CLAUDE.md`'s
"Motion naming vocabulary" already gives for a JS-only value with no matching scale rung: `durationOpen`/
`durationClose` don't land on `semantic.duration.*` (closest is `slower` at 300ms — forcing either onto
that rung would change the actual tuned open/close feel for no reason, not just rename it); `rise` is a
slide-up-on-enter travel distance, not a spacing/gap value, and `semantic.spacing.*` tops out at 32px (`xl`)
with nothing near 80px — aliasing `primitive.spacing.500` directly would misrepresent it as a spacing usage
when it's really an animation offset; and `autoDismissMs`/`scaleEnter`/`depthScale`/`depthFade` have no
shared cross-component concept to alias at all (no other component times an auto-dismiss, scales an
enter transition to this exact number, or fades stacked depth). Documented in
`scripts/audit-token-exceptions.ts`'s `KNOWN_EXCEPTIONS` (tag `ADR-011`) so the token-exceptions audit
stops surfacing them as unreviewed gaps — reviewed here, not silently exempted.

**`blurEnter` (2px) is the one exception that WAS promoted to a real shared token** —
`semantic.blur.enter`, added once Accordion and SidePanel turned out to use the exact same 2px value for
the exact same "fade in from a slight blur" arrival effect. Three independently-tuned components landing
on the identical number is the actual bar `packages/tokens/CLAUDE.md`'s "don't add tokens for one-off
states not shared across 3+ components" rule implies in reverse: once 3 genuinely do share one, it stops
being a one-off. All three now alias `{semantic.blur.enter}` instead of repeating the literal.

## Consequences

- **Positive:** `toast.*` works from anywhere, no prop drilling or context requirement at the call site.
- **Positive:** real pixel-measured stacking, not a `%`-based approximation that silently breaks on
  variable-height content — caught in the preview stage, not after shipping.
- **Negative:** a plain module-level store (not context) means multiple `ToastViewport` instances would all
  render the same global queue — acceptable since exactly one `ToastViewport` per app is the intended usage,
  same assumption most toast libraries make.
- **Negative:** portal + fixed positioning means `ToastViewport` must be mounted somewhere the app controls
  (not automatic) — a missed mount silently drops every `toast.*` call's visual output (the store still
  records it, nothing throws, but nothing renders). Worth a runtime dev warning if this comes up in practice.

## Contracts affected

New: `contracts/components/Toast.json` (the `ToastViewport` component + the anatomy of one toast item).
