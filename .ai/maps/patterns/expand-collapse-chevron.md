---
name: expand-collapse-chevron
category: motion
components: [Accordion, Select]
when: "Adding a chevron/caret indicator to any component that expands, collapses, opens, or closes."
---

# Pattern: Expand/collapse chevron

**Rule: any hand-rolled component whose own code toggles an open/closed state — an accordion, a future
dropdown, a combobox, a collapsible tree row, anything in that shape — uses `IconChevronDown` (via the
`Icon` wrapper, never rendered raw) with a vertical scaleY flip between states, driven by that component's
own duration/easing tokens.** Do not invent a new rotation treatment (a different icon, `rotate(180deg)`,
a different easing curve) for a new disclosure component — reuse this one, the same way `SPRING_SNAPPY` is
reused for sliding indicators instead of a new spring being tuned per component (see
[motion-effects.md](motion-effects.md)).

This is **plain CSS**, not Motion — a transform transition tracking a `data-state`/`data-*` attribute the
component already sets, not a `motion.*` element. It does not belong in `motion-effects.md`'s Motion
effects table for that reason, but follows the same "one canonical treatment, reused" philosophy that file
establishes for Motion-based effects.

## The pattern, concretely (from `Accordion`)

```tsx
import { IconChevronDown } from '@tabler/icons-react';
import { Icon } from '../Icon';

<span data-helix-part="{component}-chevron" aria-hidden="true">
  <Icon icon={IconChevronDown} size={16} />
</span>
```

```css
[data-helix-part="{component}-chevron"] {
  display:   inline-flex;
  color:     var(--helix-{component}-chevron);
  transform: scaleY(1);              /* closed — chevron points down */
  transform-origin: center;
  transition: transform var(--helix-{component}-duration-chevron) var(--helix-{component}-easing-collapse);
}
[data-helix-part="{component}-root"][data-state="open"] [data-helix-part="{component}-chevron"] {
  transform: scaleY(-1);             /* open — chevron points up */
  transition: transform var(--helix-{component}-duration-chevron) var(--helix-{component}-easing);
}
```

- **`scaleY(-1)`, not `rotate(180deg)`.** A vertical flip is the deliberate choice for a symmetric
  chevron glyph — visually identical result, no diagonal artifact mid-transition the way a rotation
  transform can read on some renderers.
- **Two token references, `easing` and `easing-collapse`** — kept as two separate component tokens even
  though both currently alias the same `semantic.easing.base` value (see `Accordion`'s own tokens in
  `tokens.json`). This is intentional headroom, not redundancy: `Accordion`'s collapse animation went
  through several broken iterations before landing here (a laggy, asymmetric-feeling collapse traced to
  `grid-template-rows: 0fr/1fr` interpolation, not the chevron itself — see the panel's own note in
  `Accordion.tsx`) and having the two directions independently addressable in tokens is what made that
  debugging possible. A new component adopting this pattern should still define both, even if they start
  out equal.
- **`--helix-{component}-duration-chevron`** — its own token, not reused from a shared "chevron duration"
  constant, so each component can retune independently if its container is a different size/weight than
  Accordion's panel.

## `Select`: real now, not the exception it used to be

Until 2026-09-12, `Select.json`'s `select-chevron` was documented here as the one static exception —
`Select` wrapped a real native `<select>` (ADR-001), and a native listbox's open/closed state was never
exposed to CSS, so there was nothing to hook a rotation to. That's no longer true: `Select` was rebuilt on
the new `Menu` primitive (ADR-013) — its trigger is a real `<button>` whose own React state (and
`aria-expanded`) knows exactly when the popup is open. The chevron now flips for real, using this exact
pattern, keyed off `[aria-expanded="true"]` on the trigger itself rather than a `data-state` attribute on a
separate `-root` part (see `globals.css`'s `[data-helix-part="select-trigger"][aria-expanded="true"] ~
[data-helix-part="select-chevron"]`) — a sibling-selector variant of the same rule, not a different one.

**The dividing line, updated:** does the component's own React state know whether it's open or closed right
now — whether that's exposed as `data-state` on a root (`Accordion`) or `aria-expanded` on a trigger
(`Select`)? If yes, this pattern applies, keyed off whichever attribute that component actually sets. If
the "open" state lives entirely inside the browser/OS with no hook back into the component at all (a raw
native `<details>`'s own marker triangle before it's replaced — see `Accordion.tsx`'s own
`::-webkit-details-marker { display: none }` override — or any future case of wrapping a native disclosure
element with truly no accessible state), it doesn't, and a static icon is correct there instead.

## Applying this to a new component

1. Render the chevron through `Icon` with `IconChevronDown` — never a raw Tabler import (`verify:icons`
   enforces this regardless).
2. Add `{component}.chevron` (color), `{component}.duration-chevron`, `{component}.easing`, and
   `{component}.easing-collapse` to that component's `tokens.json` block, aliasing `semantic.*` values —
   see `packages/tokens/CLAUDE.md`'s "Adding a token" steps.
3. Copy the two CSS rules above verbatim, swapping in the real `data-helix-part` names.
4. Add a row to this file's nothing-to-add-here table (there isn't one yet — if a second real consumer
   ships, add a short table here the way `motion-effects.md` does for its own approved-effects list).
5. Confirm the component's own root sets `data-state="open"`/`data-state="closed"` (or equivalent) so the
   selector above has something real to match — this pattern assumes that attribute already exists as part
   of the component's normal anatomy, it doesn't introduce it.

## Reference

- `packages/core/src/components/Accordion/Accordion.tsx` / `Accordion.json` — the canonical
  implementation and contract wording.
- [motion-effects.md](motion-effects.md) — the sibling pattern file for Motion-based (JS) effects; read
  both before adding any new interactive animation.
