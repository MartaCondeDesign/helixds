---
name: motion-effects
category: motion
components: [FAB, Switch, Button, IconButton, Checkbox, RadioGroup, Chip, NavItem, Input]
when: "Deciding whether a component should use a Motion-based animation, and how."
---

# Pattern: Motion effects

Governed by [ADR-007](../../docs/ADR/ADR-007-motion-engine.md) (supersedes
[ADR-006](../../docs/ADR/ADR-006-liquid-motion-effects.md), which adopted `liquid-gooey` — replaced the same
day after real debugging cost). Read ADR-007's two hard rules before using any of this — this file is the
day-to-day reference, the ADR is the reasoning.

## What's available

| Need | Motion API | Import |
|------|-----------|--------|
| Simple position/scale/opacity animation | `motion.<element>` with `animate`/`initial`/`exit` + `transition` | `import { motion } from 'motion/react'` |
| Mount/unmount transitions | `AnimatePresence` wrapping conditionally-rendered `motion.*` children | `import { AnimatePresence } from 'motion/react'` |
| Drag-to-reorder a list | `Reorder.Group`/`Reorder.Item` — both take an `as` prop for real semantic elements (`as="tbody"`/`as="tr"`, not just the `ul`/`li` defaults) | `import { Reorder, useDragControls } from 'motion/react'` |

There is no gooey blob-merge equivalent — Motion animates individual elements' transform/opacity/color, it
doesn't blend SVG silhouettes into one shape. Don't reach for Motion expecting that specific look; that was
`liquid-gooey`'s one differentiator and it's gone with it (see ADR-007's Consequences).

## Approved component ↔ effect table

| Component | What | Status |
|-----------|------|--------|
| `FAB`     | Speed-dial expand/collapse — `AnimatePresence` + `motion.button` per action (fade/scale/slide, not a shape merge), plus a squish-and-release `animate={{ scale }}` bounce on the trigger when it collapses. | Shipped. |
| `Switch`  | Thumb position — `motion.span` + spring `animate`/`transition`. | Shipped. |
| Table rows / Cards | Drag-reorder — `Reorder.Group`/`Reorder.Item`, `as="tbody"`/`as="tr"` for table rows. | **Storybook-only pattern**. Try it interactively in `Components/Table`'s `DragReorder` story (`apps/storybook/stories/Components/Table.stories.tsx`, `DragRow`), or in context in `apps/storybook/stories/Dashboard.stories.tsx` (`MemberRow`, `handleReorder`). Not a shipped Table/Card prop — do not wire this into the real contracts without a follow-up decision, same status the earlier Bend spike had. **Two things every drag row must do:** `e.preventDefault()` in the grip's `onPointerDown` before `dragControls.start(e)` (otherwise the browser selects the text of every row the pointer crosses), and `data-dragging` on the `Reorder.Item` via `onDragStart`/`onDragEnd` (Table's CSS then keeps that row highlighted and switches off the other rows' hover fill + transition — without it, rows sliding under the pointer flash). |
| `Chip` (dismiss) | Merge-on-dismiss (blob fusing into a neighbor). | **Tried and removed** — was a `liquid-gooey` spike (`ChipGroup.tsx`, deleted); there's no Motion equivalent for the shape-merge look. What shipped instead: a plain fade+scale-down exit, `animate`/`onAnimationComplete` — the real `onDismiss()` callback fires only once the exit finishes, so the consumer's list update lands exactly as the chip is already invisible. |
| `Button` / `IconButton` | Press feedback — `whileTap={{ scale }}` (0.97 / 0.94). | Shipped. **No `MotionConfig` here** — `whileTap` only plays while the user is actively pressing, gated on `isDisabled`; it's the same category as a CSS `:active` pseudo-class, which `prefers-reduced-motion` doesn't suppress either. This is the one deliberate exception to checklist item 1 below — don't extend it to any *autoplaying* animation. |
| `Checkbox` / `RadioGroup` | Check/dot pop-in. | Shipped, but **not Motion** — plain CSS `transform: scale()` transition. The indicator's visibility already tracks the native input's `:checked` state directly, which is correct for both controlled and uncontrolled usage on its own; adding a JS-tracked boolean just to drive Motion here would reintroduce the exact class of controlled/uncontrolled bug found and fixed in Switch, for no visual benefit CSS doesn't already deliver. Left as a documented case of "the checklist says Motion, the right call here is plain CSS." |
| `NavItem` | Sliding "current" indicator between nav items. | Shipped — `motion.span` with a shared `layoutId` (`ACTIVE_INDICATOR_LAYOUT_ID` in `NavItem.tsx`) across every instance; Motion's layout system animates it moving from the previously-current item to the new one instead of the background just cutting over. |
| `AvatarGroup` | Hover lift — only the hovered avatar itself lifts/scales, no cascade to neighbors. | Shipped, but **not Motion** — plain CSS `[data-helix-part="avatar-group-item"]:hover`, no JS at all. Went through the preview-first process (`.ai/skills/ds-preview-before-ship.md`): an earlier version cascaded a distance-based falloff to neighboring avatars (JS-computed `data-hover-distance`, Motion-adjacent complexity) — cut after review feedback that only the hovered avatar should move, at which point the whole effect collapsed to a single `:hover` rule and the JS became unnecessary, same "plain CSS is the right call" reasoning as Checkbox/RadioGroup and Input's shake. Values are `component.avatarGroup.hover-lift`/`hover-scale`, aliasing the new generic `semantic.transform.lift.s`/`scale.s` scale (2px lift + 2% scale — the subtler option, chosen for a compact group) (not component-scoped — see `packages/tokens/CLAUDE.md`'s "Motion naming vocabulary" and `Foundation/Semantic`'s Motion story for the full `transform.lift`/`scale.{s,m,l}` scale, most of which no other component consumes yet). Approved 2026-09-24. Under `prefers-reduced-motion: reduce` the avatar doesn't move at all (no lift, scale or transition). |
| `Input` (invalid) | Error-state shake — plays once when `invalid` transitions false→true (not on initial mount, not repeatedly while it stays invalid). | Shipped, but **not Motion** — plain CSS `@keyframes` + a `data-shaking="true"` attribute toggled imperatively via ref (remove/reflow/reapply, so a second failed attempt while still invalid retriggers it). Bespoke per-segment easing authored in Figma, same "plain CSS is the right call" reasoning as Checkbox/RadioGroup below. This is the one exception to the "never on Input/Select/Textarea" rule underneath: it fires only on a genuine state transition (the field just became invalid), the same category of feedback as `aria-invalid`/the error message appearing, not ambient/decorative motion — see `.ai/skills/ds-preview-before-ship.md` for how this got approved (a throwaway Artifact preview, tried in both themes and with reduced motion, before touching `Input.tsx`). |

**Never use a motion effect on:** `Select`, `Textarea` (form fields — motion here reads as
instability, not delight, and neither has an approved exception yet — if one comes up, it goes through the
same preview-first process Input's shake did), `Table` itself as a dense-data surface (only the drag-reorder
pattern above is scoped, not decorative motion on every row by default), or any component whose whole job is
to be read quickly and factually (`Badge`, status indicators). `Input` itself stays off-limits for anything
beyond the one shipped shake above — a new effect there needs its own preview and sign-off, not a rider on
this exception.

## Checklist before shipping a new Motion usage

0. **Preview it before it touches a real contract — mandatory for any new effect, or any change to an
   entry in the "never use" list above.** Follow [`.ai/skills/ds-preview-before-ship.md`](../../skills/ds-preview-before-ship.md):
   build the effect against the component's real tokens/anatomy in a throwaway preview (a Storybook story
   not wired into the exported component, or a published Artifact), get explicit sign-off, and only then
   implement it for real — updating this file's table (and the "never use" list, if the effect overturns
   one of its entries) in the same change, not after. This is how Input's error-state shake got approved;
   see its row above.
1. **Reduced motion is not automatic.** Verified against motion.dev's own accessibility docs, not assumed
   — Motion needs an explicit `<MotionConfig reducedMotion="user">`. Scope it locally around the component's
   own animated elements (see FAB/Switch) rather than relying on the consuming app having wrapped its root
   in one; a shared component can't assume that setup exists. Exception: brief, user-driven `whileTap`
   press feedback (Button/IconButton) — same category as CSS `:active`, not what reduced-motion targets.
2. Verify in Storybook with `prefers-reduced-motion: reduce` on (devtools → Rendering tab) — confirm the
   `MotionConfig` you added actually degrades this specific usage, not just that the prop is present.
3. `fill`/`background`/`color` values inside `animate`/`initial`/`exit` are `--helix-*` token references
   (`var(--helix-...)`), same rule as everywhere else in Helix — Motion can animate CSS custom properties
   directly, no resolution hack needed (that hack was `liquid-gooey`-specific and is gone, see ADR-007).
4. Expect `verify:props` to flag Motion's own object keys that collide with `prop-map.md` names by
   coincidence — `type: 'spring'` (Transition), `scale` (animate/initial/exit target) are confirmed false
   positives, report-only, not a Helix prop. Add a one-line comment at the call site when you hit a new one
   rather than trying to rename Motion's own API.
5. Verify dark mode — same as any other visual change.

## Shared presets

Spring physics (`stiffness`/`damping`) and cubic-bezier `ease` arrays have no `var()` form — they can
never be `tokens.json` entries (see `packages/tokens/CLAUDE.md`'s "Motion naming vocabulary" and "What
NOT to do"). They're centralized in `packages/core/src/lib/motionPresets.ts` instead — `SPRING_SNAPPY`
(shared by Switch's thumb and NavItem's indicator; consolidates a previously undocumented `damping: 32`
vs `35` drift between the two), `EASE_BACK`/`EASE_COLLAPSE` and FAB's three named transitions, and
`PRESS_SCALE_DEFAULT`/`PRESS_SCALE_COMPACT` for Button/IconButton's `whileTap`. Import from there instead
of typing a new spring/easing literal inline — that inline-per-component pattern is exactly how the
Switch/NavItem drift happened.

## Reference

- [expand-collapse-chevron.md](expand-collapse-chevron.md) — the sibling pattern for a disclosure
  component's chevron icon (Accordion's `scaleY` flip). Plain CSS, not Motion, so it lives in its own
  file rather than this table — read it before adding a chevron to any new expand/collapse component.
- [ADR-007](../../docs/ADR/ADR-007-motion-engine.md) — why Motion, what replaced `liquid-gooey` and why.
- [ADR-006](../../docs/ADR/ADR-006-liquid-motion-effects.md) — superseded, historical reasoning only.
- [ADR-005](../../docs/ADR/ADR-005-elevation-policy.md) — which components may ever carry a shadow (FAB's
  `box-shadow` is now plain CSS, no special resolution needed).
- `packages/core/src/lib/resolveTokenPx.ts` — shared `getComputedStyle`-based numeric token resolver, used
  by FAB's speed-dial offsets and Switch's thumb position (Motion's `animate.x`/`animate.y` are plain
  numbers, tokens are CSS custom properties — something still has to bridge the two, engine-independent).
