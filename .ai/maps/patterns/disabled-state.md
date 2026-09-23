---
name: disabled-state
category: color
components: [Button, IconButton, Input, Select, Textarea, Menu, Checkbox, CheckboxGroup, RadioButton, RadioGroup, Switch, SegmentedControl, Chip]
when: "Building or touching any interactive component's disabled state — the control itself, or a label/text sitting next to it."
---

# Pattern: Disabled state

**Rule: disabled means a real, solid gray look built from dedicated `component.{name}.fill/text/icon/border.disabled`
tokens (aliasing `semantic.color.fill/text/icon/border.disabled`) — never `opacity`.** Decided 2026-09-13, after
Button's disabled state turned out to be sharing a bare `opacity: 0.5` rule with its own `loading` state (see
"Loading is not disabled" below for why that combination was itself wrong, independent of the opacity issue).

## Why not opacity

`opacity` fades everything inside the element toward whatever's behind it — background, border, text, icon,
all at once, at whatever contrast ratio falls out of the underlying colors and the page behind them. That's
the right tool for a large surface or an image going translucent as a whole (an entire disabled table, a
preview thumbnail) — but for a compact control (a button, an input, a checkbox), it means the disabled look
is never actually authored: it's a mechanical dimming of whatever colors were already there, landing on a
different effective gray per variant and per theme instead of one deliberate, consistent look.

## The rule

1. **Background** → `component.{name}.fill.disabled` → `{semantic.color.fill.disabled}`
2. **Text** → `component.{name}.text.disabled` → `{semantic.color.text.disabled}`
3. **Icon** (if the component renders one) → `component.{name}.icon.disabled` → `{semantic.color.icon.disabled}`
4. **Border** (if the component has one) → `component.{name}.border.disabled` → `{semantic.color.border.neutral-light}`
   — the established convention across every compliant component so far, not a dedicated
   `semantic.color.border.disabled` (no such token exists).

These semantic tokens are already documented as not-WCAG-compliant by design (see
`semantic.color.text.disabled`'s own `$description`) — a disabled control is expected to read as visibly
inert, not to pass 4.5:1. Don't chase a contrast fix here; that's the intended contrast.

## Loading is not disabled — don't let them share CSS

A `loading` state is not a disabled state, even though the element commonly gets the native `disabled`
attribute in both cases so it can't be interacted with mid-request (see `Button.tsx`:
`disabled={disabled || loading}`). Visually they're opposites: loading keeps the component's normal variant
colors — the user should still see "this is the primary/danger action," just busy right now — the spinner in
front of the label is the only visible change. Disabled visually recedes. Because the native `disabled`
attribute is shared, every disabled-only CSS rule needs `:not([data-loading])` (or the component's own
loading attribute) so loading doesn't fall into the gray look by accident — see Button's
`[data-helix-part="button"]:disabled:not([data-loading])` rule.

## Status (as of 2026-09-13)

Every component in the list above is compliant — no `opacity`-based disabled state left anywhere in
`globals.css`. Fixing the rest of the list turned up two components (`Checkbox`, `RadioButton`) whose
`fill.disabled`/`border.disabled` tokens already existed in `tokens.json` but were never wired into any CSS
rule — the control itself was fading via the same bare opacity as its label, silently ignoring its own
dedicated tokens. Both are now wired: `[data-helix-part="{checkbox,radio}-input"]:disabled + [...]-control`
sets the real disabled fill/border, placed after the `:checked` rule in source order so it wins when an item
is both checked and disabled.

## Reference

- `packages/core/src/globals.css` — Button's `[data-helix-part="button"]:disabled:not([data-loading])` block
  (plus its icon-color sibling rule) is the reference implementation.
- `packages/tokens/src/tokens.json` — `component.button.fill/text/icon/border.disabled`.
- [form-field-spacing.md](form-field-spacing.md) — the sibling pattern for how a cross-component rule gets
  enforced here: one canonical approach, documented exceptions, a reference implementation named explicitly.
