---
name: border-always
category: foundation
components: [Badge, Button, Chip, IconButton, Input, Select, Textarea, Checkbox, RadioButton, Card]
when: "Building or changing any component that has a border in at least one of its variants or states."
---

# Pattern: Border always

**A rule, not a component.** If a component has a border in any variant or state, it has that border in
**every** variant and state, at the same width. States and variants change the border's **color** only —
never whether it exists, never its width.

## Why

A border takes up space. When it appears in one state and disappears in another, the component changes
size between them: the label shifts, the row reflows, a chip gets 2px narrower when it's toggled. That
happened in Figma (the old checked Chip lost its stroke, and with the stroke counted in the layout the chip
shrank). One border, always there, keeps every state the exact same size.

## Rule

- **Code:** declare the border once on the base rule (`border: var(--helix-borderWidth-thin) solid …`).
  State and variant rules only set `border-color`. When a state shouldn't show a border, set
  `border-color` to the same color as the fill (or `transparent`) — never `border: none` / `border-width: 0`.
  (Resetting the native border of an inner element — the `<input>` inside Input's wrapper, a bare icon
  button — is not a state change and is fine.)
- **Figma:** every variant of the component carries the stroke, same weight, same alignment. A state with
  "no visible border" binds the stroke to the same Theme variable as the fill underneath — the stroke is
  still there, so the frame keeps its size.
- **Checked by:** `scripts/figma/audit-component.js` (check 6, `border`) — fails when a layer has a stroke
  in some variants and none, or a different weight, in others.

## Applies to

Every bordered component: Badge, Button (ghost keeps a 1px transparent border), Chip, IconButton, Input,
Select, Textarea, MultiSelect, Checkbox, RadioButton, Card.
