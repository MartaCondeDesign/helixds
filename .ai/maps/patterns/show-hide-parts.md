---
name: show-hide-parts
category: foundation
components: [Chip, Button, Input, Badge, Select, NavItem]
when: "A component has an optional part that is either there or not — an icon, a trailing icon, a dismiss ×, a spinner, a description line."
---

# Pattern: Show/hide parts

**A rule for building components, in code and in Figma.** An optional part that only appears or disappears —
it doesn't change any color, size or state of the rest of the component — is a **boolean** in code and a
**BOOLEAN property** in Figma. Never a VARIANT.

## Why

Every VARIANT axis multiplies the Figma variant count. Chip with `dismissible` as a variant had 100 variants;
as a boolean it has 50. A boolean also maps 1:1 to the code prop, so designers and developers toggle the same
thing.

A Figma BOOLEAN can only show or hide a layer — it can't change a padding. So the rule only works if the
component is **built so that showing or hiding the part never changes any other spacing**.

## Rule

1. **The part brings its own spacing.** Whatever space it needs between itself and its neighbour lives on
   the part itself (a padding on its own wrapper), not on the container. The container's paddings are the
   same with or without it.
   - Chip: `chip-icon` carries 2px on the label side, `chip-icon-end` and `chip-dismiss` too; the chip keeps
     12px on both ends whether or not any of them is shown. Hiding one removes exactly its own width.
2. **Code mirrors Figma.** The part is rendered in the normal flow inside the container that holds the
   paddings (no absolute positioning that needs the container to reserve room for it, no padding that
   switches with the prop). If the part has a hover surface bigger than itself (the ×'s round hover), draw
   it with a pseudo-element that takes no layout space.
3. **In Figma:** a BOOLEAN property bound to the part's visibility (`componentPropertyReferences.visible`),
   named exactly like the code prop (`icon`, `iconEnd`, `dismissible`, `loading`…). An icon slot gets the
   BOOLEAN plus an INSTANCE_SWAP (components-to-figma.md).
4. **When it can't be a boolean:** only if showing the part changes something else's color, size or state
   (e.g. `loading` replacing the label and dimming the button) — then it's a VARIANT, and the contract's
   `figma.properties` says why.

## Code stays implicit (decided 2026-10-03)

The boolean doesn't need its own prop in code. An icon slot is shown by passing `icon`; an optional text
part (`description`, `errorMessage`…) is shown by passing its text. Figma mirrors that with two properties
on the same layer: a BOOLEAN named exactly like the prop (`description`) for visibility and a TEXT
`description text` for the content — the same pairing as `icon` + `icon swap`. `.ai/maps/figma-map.md` marks
these rows as `BOOLEAN` + `TEXT`; a component whose Figma set lacks one of them is out of date.

## Checklist when building a component

- [ ] Every optional part is a boolean prop in code
- [ ] Toggling it doesn't change any padding or gap outside the part (measure both states)
- [ ] In Figma it's a BOOLEAN on the part's visibility, same name as the prop
