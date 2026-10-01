---
name: group-spacing
category: layout
components: [Button, IconButton, Chip, Badge]
when: "Placing several elements of the same kind one after another — a button group, a row of chips, a set of badges."
---

# Pattern: Group spacing

**A rule, not a component.** Elements of the same kind placed one after another form a group, and the
elements inside a group are **4px apart** — `var(--helix-spacing-2xs)`.

## Why

A group should read as one unit. At 8px or 12px, two buttons or a row of chips start to read as separate,
unrelated controls; 4px keeps them visibly together while each one is still distinct and easy to hit.
One value everywhere also means any group looks the same wherever it appears.

## Rule

- **Same kind, one after another → 4px** (`--helix-spacing-2xs`):
  - button groups — page header actions, a form's Cancel/Submit, a Modal footer, a toolbar
  - icon-button groups — a view toggle, row actions
  - chip groups — active filters, selected values
  - badge groups — several statuses or tags on one item
- **Between different groups → more space** (8px or more), so the groups read apart. The one deliberate
  case: a destructive action is set apart from the rest (see `action-bar.md` — Delete sits 16px away).
- **Not a group:** a control next to unrelated content (a search field and its Clear button are 4px apart
  because they act as one control row, but a heading and its actions are not a group).

## Code

```tsx
<div style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)' }}>
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>

<div aria-label="Active filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--helix-spacing-2xs)' }}>
  {filters.map(f => <Chip key={f.key} label={f.label} dismissible onDismiss={() => remove(f.key)} />)}
</div>
```

## Where it's applied

Search + Filter (chips, and field ↔ Clear), Empty State and Action Bar buttons, Batch actions, the view
toggle, Team Dashboard's Export + view toggle, Form Field Group's Cancel/Submit, Modal's footer
(`component.modal.footerGap` → `semantic.spacing.2xs`), and the selected chips inside MultiSelect.

## Anti-patterns

- ❌ A hand-picked 6px / 8px / 12px between buttons of the same group
- ❌ The same gap between two different groups as inside one — they stop reading as separate
- ❌ A hardcoded `4px` instead of `var(--helix-spacing-2xs)`
