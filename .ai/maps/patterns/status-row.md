---
name: status-row
category: data-display
components: [Badge]
when: "Displaying an item with its current status in a list, table row, or detail view."
---

# Pattern: Status Row

## When to use

- Table rows with a status column (active, inactive, pending)
- Detail view headers showing the current state of a record
- Notification/activity feed items
- Task list items with completion state

## Anatomy

```
┌─────────────────────────────────────────────────────────┐
│  ○  Deploy to production     [Success]   2 min ago      │
│  ○  Run test suite           [Warning]   5 min ago      │
│  ○  Build Docker image       [Neutral]   12 min ago     │
│  ○  Code review              [Danger]    1 hr ago       │
└─────────────────────────────────────────────────────────┘
```

## Badge variant → semantic meaning

| Variant   | Use for                                          |
|-----------|--------------------------------------------------|
| `success` | Completed, active, healthy, published, verified  |
| `warning` | Pending, in review, needs attention, expiring    |
| `danger`  | Failed, blocked, overdue, expired, error         |
| `info`    | Scheduled, queued, in progress                   |
| `neutral` | Draft, inactive, archived, unknown               |

**Rule: Never use color alone to communicate status.** The Badge label must also communicate the status.

## Code

```tsx
import { Badge } from '@helix-ds/core';
import type { BadgeVariant } from '@helix-ds/core';

type Status = 'active' | 'pending' | 'failed' | 'draft' | 'scheduled';

const statusConfig: Record<Status, { variant: BadgeVariant; label: string }> = {
  active:    { variant: 'success', label: 'Active' },
  pending:   { variant: 'warning', label: 'Pending' },
  failed:    { variant: 'danger',  label: 'Failed' },
  draft:     { variant: 'neutral', label: 'Draft' },
  scheduled: { variant: 'info',   label: 'Scheduled' },
};

// A list of rows that share columns, so every Badge lines up in one column, left-aligned. Each row is a
// subgrid of the list's three columns (label · status · meta); a per-row flex layout would instead
// start each Badge wherever that row's label happened to end.
function StatusList({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-helix-pattern="status-row-list"
      style={{
        display:             'grid',
        gridTemplateColumns: '1fr auto auto',
        columnGap:           'var(--helix-primitive-spacing-75)',
      }}
    >
      {children}
    </div>
  );
}

function StatusRow({ label, status, meta }: { label: string; status: Status; meta?: string }) {
  const { variant, label: statusLabel } = statusConfig[status];

  return (
    <div
      data-helix-pattern="status-row"
      style={{
        display:             'grid',
        gridColumn:          '1 / -1',
        gridTemplateColumns: 'subgrid',
        alignItems:          'center',
        justifyItems:        'start',
        padding:             'var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)',
        borderBottom:        '1px solid var(--helix-color-border-neutral-light)',
      }}
    >
      <span style={{
        fontSize:   'var(--helix-primitive-fontSize-s)',
        color:      'var(--helix-color-text-neutral)',
        fontWeight: 'var(--helix-primitive-fontWeight-medium)',
      }}>
        {label}
      </span>

      <Badge variant={variant} label={statusLabel} />

      <span style={{
        justifySelf: 'end',
        fontSize:    'var(--helix-primitive-fontSize-s)',
        color:       'var(--helix-color-text-neutral-lightest)',
      }}>
        {meta}
      </span>
    </div>
  );
}

// <StatusList>
//   <StatusRow label="Deploy to production" status="active" meta="2 min ago" />
//   <StatusRow label="Code review" status="failed" meta="1 hr ago" />
// </StatusList>
```

## Rules

1. Badge label must describe the status in words — not just color
2. Use the semantic variant that matches the emotional valence (success = good, danger = bad)
3. When status is dynamic (changes without page reload), add `role="status"` to the Badge
4. Avoid mixing `size="s"` and `size="m"` badges in the same table column
5. Rows go inside a `StatusList` (shared columns) so the badges line up, left-aligned, in one column

## Anti-patterns

- ❌ Custom `<div style={{ background: 'red' }}>Failed</div>` — use Badge
- ❌ `variant="danger"` for "pending" — pending is `warning`
- ❌ `variant="info"` for "active" — active is `success`
- ❌ Using Badge without a text label (icon-only Badge) — always include a label
