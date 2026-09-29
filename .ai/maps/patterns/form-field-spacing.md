---
name: form-field-spacing
category: spacing
components: [Input, Select, Textarea, Checkbox, CheckboxGroup, RadioGroup, RadioButton]
when: "Adding or touching the vertical spacing around any form field's label or description/error text."
---

# Pattern: Form field spacing

**Rule: every form field's label-to-control gap, and its control-to-description/error gap, is
exactly `semantic.spacing.component-s` (8px) — the same value, everywhere, no per-component
exception.** This applies to `Input`, `Select`, `Textarea`, `Checkbox`, `CheckboxGroup`,
`RadioGroup`, and `RadioButton`. Decided after review found these had silently drifted — Select
briefly shipped a 16px label gap as a one-off before this rule replaced it, and every other
component here was hardcoding a raw `primitive.spacing.25` (4px, sometimes coincidentally
`primitive.spacing.50`/8px) with no component token backing it at all. Neither was a deliberate
exception; all are now 8px, tokenized properly.

## The two gaps this covers

1. **Label → control.** For `Input`/`Select`/`Textarea`, the space between the visible `*-label`
   and the field itself. For `CheckboxGroup`/`RadioGroup`, the equivalent is their `*-legend` (a
   fieldset's own stacked group label) to `*-options` — same concept, same 8px. The standalone
   `Checkbox`/`RadioButton` don't have a separate stacked label at all — their label sits inline
   beside the control, not above it — so this half of the rule doesn't apply to them structurally;
   skip it, don't force a gap that doesn't correspond to anything in their anatomy.
2. **Control → description/error.** The space between the field (or, for the group components, the
   whole options block; for standalone Checkbox/RadioButton, the control+label row) and its own
   `*-description`/`*-error` text below it. This half applies to **all seven** components — every
   one of them can render a description or error line, and that gap is 8px everywhere.

## The one documented exception: `Switch`

`Switch` does not follow this rule. Its own label sits **beside** the toggle in a horizontal row,
not above a stacked field — a different spatial relationship entirely, not a vertical "label above
control" gap this rule is about. Do not force `component-s` onto Switch's toggle↔label gap; that's
a different design question (horizontal control-to-label spacing), out of this rule's scope.

## Implementation

Each component gets its own `gap` token under `component.{name}.gap`, aliasing
`semantic.spacing.component-s` — never a raw `primitive.spacing.*` reference and never a literal.
Since label→control and control→description want the same value everywhere today, one shared
token is enough — don't split into two identically-valued tokens purely for documentation's sake.
A plain flex `gap` on the root usually applies it to every in-flow child directly; a `*-legend`
using `float: left` (RadioGroup/CheckboxGroup) sits outside that flow and needs the same token
applied as its own explicit `margin-bottom` instead, since flex `gap` skips floated children.

## Multi-field forms: fields, blocks, and section headers

A longer form (settings pages, onboarding flows — see `Pages/Form`) groups fields into
labeled **blocks** (e.g. "Personal info", "Workspace", "Preferences"). This is a page-level layout
pattern, not a single component, so there's no `component.*` token for it — these are `primitive.spacing.*`
values applied directly at the composition site, same as any other layout decision `CLAUDE.md`
leaves to the consumer/pattern. Three distinct gaps, not to be confused with each other:

1. **Between fields within one block** — 16px (`primitive.spacing.100`). Note this is **double**
   the 8px label/description gap above — that 8px is the *tight* gap around one field's own parts;
   this 16px is the *looser* gap separating one whole field from the next.
2. **Block header → its first field** — also 16px (`primitive.spacing.100`), the same value as #1.
   A block's header behaves like just another sibling in that block's own field stack, not a
   separately-spaced element.
3. **Between blocks** (one labeled section's last field/divider to the next block's header) —
   24px (`primitive.spacing.150`), deliberately larger than #1/#2 so a scan of the page reads the
   block boundaries before the field boundaries within them.

**Block header typography: `semantic.textStyle.heading-m-bold`** (14px, bold, normal case) —
not the smaller, muted, uppercase "eyebrow" treatment `Menu`'s own group label uses
(`label-uppercase`, a different, much quieter role for a popup listbox, not a full page section).
A form block header is a real heading; render it as one.

```tsx
<form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-150)' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
    <h3 style={{
      margin: 0,
      fontSize: 'var(--helix-textStyle-heading-m-bold-fontSize)',
      fontWeight: 'var(--helix-textStyle-heading-m-bold-fontWeight)',
      lineHeight: 'var(--helix-textStyle-heading-m-bold-lineHeight)',
      color: 'var(--helix-color-text-neutral)',
    }}>
      Personal info
    </h3>
    <Input label="Full name" ... />
    <Input label="Work email" ... />
  </div>
  {/* next block, 24px away */}
</form>
```

## Reference

- `packages/tokens/src/tokens.json` — `component.{input,select,textarea,checkbox,radio}.gap`;
  `semantic.textStyle.heading-m-bold` for block headers.
- `apps/storybook/stories/ProductPage.stories.tsx` (`Pages/CreateWorkspace`) — the reference
  implementation of the multi-block layout above.
- [expand-collapse-chevron.md](expand-collapse-chevron.md) — the sibling pattern for a cross-component
  rule enforced the same way (one canonical value, documented exceptions called out explicitly,
  not silently allowed to drift per component).
