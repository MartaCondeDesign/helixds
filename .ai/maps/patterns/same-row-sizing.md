---
name: same-row-sizing
category: layout
components: [Button, IconButton, Input, Select]
when: "Placing two or more controls side by side on one line — a top bar, a filter row, a toolbar, an action bar."
---

# Pattern: Same-row sizing

**A rule, not a component.** Controls that sit next to each other on the same line share the same `size`
(ADR-004's control ladder: `s` → 24px, `m` → 32px, `l` → 40px), so their heights match.

## Why

A 24px search field next to 32px icon buttons reads as a mistake, not a hierarchy: the eye sees two
edges that almost line up but don't. Mixed heights in one row look unfinished even when every control is
correct on its own. The Team dashboard's top bar had exactly this: `Input size="s"` (24px) beside
`IconButton size="m"` (32px).

## Rule

- **Same row → same `size`.** Pick one size for the row and pass it to every control in it: `Input`,
  `Select`, `Button`, `IconButton`.
- **Default to `m`** unless the whole row has a reason to be denser (`s`, e.g. a bulk-action bar inside a
  table) or larger (`l`).
- **Applies wherever controls line up:** top bars, filter rows (search + selects + buttons), toolbars,
  action bars, view toggles, a form's inline submit row.
- **Doesn't apply to** non-control content in the row: text, `Badge`, `Chip`, `Avatar`. Those follow
  their own density model (see ADR-004's documented exceptions) and are vertically centered, not matched
  in height.
- **`SegmentedControl` has no `size` prop.** It is always 24px (`semantic.size.s`), so put it in a
  row of `s` controls, or accept the mismatch knowingly. Don't stretch it with `style`.

## Code

```tsx
<TopBar
  start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search members…" size="m" />}
  end={
    <>
      <IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />
      <IconButton variant="ghost" size="m" icon={IconHelp} label="Help" />
    </>
  }
/>
```

## Anti-patterns

- `Input size="s"` next to `IconButton size="m"`: 24px beside 32px.
- A `Select` at the default `m` next to a `Button size="s"` in the same filter row.
- Faking a match with a hardcoded `height` in `style` instead of choosing the same `size`.
