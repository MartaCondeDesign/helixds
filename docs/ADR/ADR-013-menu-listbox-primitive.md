# ADR-013 — Menu/Listbox primitive: hand-rolled ARIA listbox, ports Select off the native `<select>`

**Date:** 2026-09-12
**Status:** Proposed
**Deciders:** Helix DS team

## Context

`Select` currently wraps a real native `<select>` (ADR-001's native-first default) — correct per that ADR's
own rule for form elements, but it has a real, reported cost: the dropdown listbox that opens on click is
rendered entirely by the OS/browser and cannot be styled. It looks like a system control, not a Helix
component, and `apps/storybook/stories/Changelog.stories.tsx`'s date filter has the same problem one level
worse — `<Input type="date">` opens a full native calendar picker with zero Helix visual identity, currently
"fixed" only by hiding the picker's icon via a CSS hack that doesn't touch the picker UI itself.

Per root `CLAUDE.md` rule 4 / `ADR-001`'s own scoping, `Menu`/`Popover`/`Combobox` are explicitly named as
components with **no native HTML equivalent**, requiring their own ADR and explicit primitive choice before
implementation — this was decided in advance, not discovered now. No `Menu`/`Listbox`/`Popover` component
exists anywhere in the codebase today (confirmed against `contracts/manifest.json`'s full 24-component
list) — this is new foundational work, not an extension of something partial.

## Decision

**A new `Menu` primitive — hand-rolled WAI-ARIA listbox, not a native element.** Root has `role="listbox"`,
each item `role="option"` + `aria-selected`, roving `tabIndex`, arrow-key navigation, `Home`/`End`, and
typeahead (typing a letter jumps to the next matching option) — the same category of hand-rolled keyboard
behavior `SegmentedControl` already established for its own `radiogroup` (ADR-012), extended to listbox
semantics.

**Portaled to `document.body`, like `Toast`.** A dropdown menu anchored to a trigger deep in a component
tree needs to render above everything else on the page regardless of any ancestor's `overflow: hidden` or
`z-index` stacking context — the same reasoning `Toast` already established (ADR-011), applied here to a
per-trigger popup instead of a fixed viewport stack.

**Positioning: always below + cross-axis clamp, adapted from Tooltip's `useAutoPlacement`
(ADR-009).** Unlike Tooltip's 4-direction placement, a dropdown menu has one placement: below the
trigger, left-aligned to it. It never flips above, even when there isn't room below — the page scrolls
instead (revised 2026-10-01, per design direction: a form field's menu belongs below the field, even if
that means it runs past the visible area). Same recalculate-on-mount/resize/scroll pattern and
the same `EDGE_GUTTER` viewport-collision principle as Tooltip, applied only horizontally, so the menu never
overflows the left/right edge for a trigger sitting near either side of the viewport.

**Select is rebuilt on top of Menu — trigger becomes a real `<button>`, not `<select>`.** The visible
control is a button styled identically to today's `select-trigger` (same tokens, same anatomy part names
where they still apply), which opens a `Menu` positioned below it on click/Enter/Space/ArrowDown, exactly
matching the native `<select>` interaction model it replaces. Native `<select>`'s free keyboard handling,
form validation, and autofill integration go away with the native element — `Menu`'s own hand-rolled
keyboard nav replaces the first, and form participation is replaced with a hidden `<input type="hidden"
name={name} value={value}>` kept in sync with the selected option (the same pattern most hand-rolled
listbox implementations use — Select's own `required`/`invalid` validation becomes JS-checked on submit
rather than native, same category of change `RadioButton`'s roving-tabindex already accepted for
`SegmentedControl`).

**Scope for this ADR: `Menu` the primitive, and `Select` rebuilt to consume it.** A full calendar-grid
`DatePicker` (month/year navigation, date-range selection, keyboard date arithmetic) is a separate,
larger design problem layered on top of `Menu` — it gets its own follow-up ADR and preview cycle once
`Menu` exists, not folded into this one. `Changelog.stories.tsx`'s `<Input type="date">` is addressed by
that follow-up, not by this ADR directly.

## Consequences

- **Positive:** Select's dropdown finally carries Helix's visual identity (tokens, radius, shadow per
  ADR-005, typography) instead of the OS's — the actual, repeatedly reported problem this ADR exists to fix.
- **Positive:** `Menu` becomes a reusable primitive for anything else that needs a Helix-styled popup list —
  the eventual `DatePicker`, a future `Combobox`, a context menu — not a one-off built only for `Select`.
- **Negative:** losing the native `<select>` means losing free mobile OS picker UI (iOS/Android's own
  large-target native select sheet) — a hand-rolled `Menu` needs its own mobile-viewport consideration,
  not covered by this ADR and worth flagging as a real UX trade-off, not an oversight.
- **Negative:** form validation, autofill, and screen-reader behavior that "just worked" via native
  `<select>` all become Helix's own responsibility now — same category of cost `Toast`/`Modal`/`Tooltip`
  already accepted for their own hand-rolled ARIA, but real, and untested against actual assistive
  technology before this ships.
- **Negative:** meaningfully larger surface area than a token/CSS change — positioning, portal, keyboard
  nav, and hidden-input form sync all need their own implementation and preview-before-ship review, the
  same weight as building `Modal`/`Toast` from scratch.

## Amendment (2026-09-12): item sizing and gap, after implementation review

`component.menu.item.height` moved from `semantic.size.m` (32px) to `semantic.size.s` (24px) after
first review, then back to `semantic.size.m` (32px) after a second review — matched to Select's own field
height so the trigger and its dropdown rows read as one continuous, aligned surface, not two different
scales. `component.menu.gap` (2px, between items) was added in the same first round, matching the request
for hairline separation "similar to the nav menu" so hovering between adjacent options always shows a
visible seam. `gap: 2px` is a literal, not a `semantic.spacing.*` alias — the scale's smallest rung is 4px
(`primitive.spacing.25`), with nothing between it and 0, and this value is a deliberately smaller hairline
than that rung provides, not a rounding of it.

`component.menu.groupDivider`'s spacing is asymmetric on purpose — `marginTop` (8px,
`semantic.spacing.component-s`) to whatever precedes the divider, `marginBottom` (16px,
`semantic.spacing.component-l`) to the group label right after it, per a second round of review
feedback. Originally one shared `marginY` (8px both sides); split into two tokens once the two directions
needed different values, rather than force-fitting one number to satisfy both.

Also fixed: `menu-item` used a fixed `height`, which clipped a wrapped two-line option label (e.g.
"Product Manager") to one line's worth of highlight — changed to `min-height` plus a real
`item.paddingY` token (`semantic.spacing.component-xs`), so the row grows to hug wrapped content
instead of cutting it off.

Separately, `Select` gained a `className` prop (previously missing entirely) so a consumer can set a
`min-width` — without one, the trigger's width was driven by whichever option's label happened to be
selected, visibly resizing on every selection change (native `<select>` doesn't have this problem; a
custom button-based trigger does unless constrained). Storybook's own stories now demonstrate
`min-w-[100px]` as the example default. No system-wide default width token was added — per root
`CLAUDE.md`'s policy, min-width/max-width stays a consumer/pattern decision, not a token.

## Amendment (2026-10-13): open/close motion

Menu now grows in from its trigger and settles out instead of appearing and vanishing (the transitions.dev
"menu dropdown" recipe, previewed and approved first). It opens from `component.menu.scale-enter` (0.97)
over `semantic.duration.enter` and closes to `component.menu.scale-exit` (0.99) over the shorter
`semantic.duration.exit`, both eased with `semantic.easing.gentle`. To animate the close, Menu stays
mounted after `expanded` turns false for the length of the close (`data-state="closing"`, `inert`,
`aria-hidden`), so nothing in it can be clicked, focused or read while it fades. Under
`prefers-reduced-motion` it unmounts at once. The two scales stay component literals, like Modal's and
Tooltip's own `scale-enter`: each overlay's scale is tuned to its own size and feel, not a shared rung.

## Contracts affected

New: `contracts/components/Menu.json`. Amended: `contracts/components/Select.json` (anatomy changes from
native `<select>` to button + portaled `Menu`; `sizing`/`tokenPolicy` mostly unchanged since visual size/
color intent stays the same, only the anatomy backing it changes).
