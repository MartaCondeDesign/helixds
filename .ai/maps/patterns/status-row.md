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

function StatusRow({ label, status, meta }: { label: string; status: Status; meta?: string }) {
  const { variant, label: statusLabel } = statusConfig[status];

  return (
    <div
      data-helix-pattern="status-row"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            'var(--helix-primitive-spacing-3)',
        padding:        'var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)',
        borderBottom:   '1px solid var(--helix-color-border-neutral-light)',
      }}
    >
      <span style={{
        flex:      1,
        fontSize:  'var(--helix-primitive-fontSize-s)',
        color:     'var(--helix-color-text-neutral)',
        fontWeight: 'var(--helix-primitive-fontWeight-medium)',
      }}>
        {label}
      </span>

      <Badge variant={variant} label={statusLabel} />

      {meta && (
        <span style={{
          fontSize: 'var(--helix-primitive-fontSize-xs)',
          color:    'var(--helix-color-text-neutral-lightest)',
          minWidth: '60px',
          textAlign: 'right',
        }}>
          {meta}
        </span>
      )}
    </div>
  );
}
```

## Rules

1. Badge label must describe the status in words — not just color
2. Use the semantic variant that matches the emotional valence (success = good, danger = bad)
3. When status is dynamic (changes without page reload), add `role="status"` to the Badge
4. Avoid mixing `size="s"` and `size="m"` badges in the same table column

## Anti-patterns

- ❌ Custom `<div style={{ background: 'red' }}>Failed</div>` — use Badge
- ❌ `variant="danger"` for "pending" — pending is `warning`
- ❌ `variant="info"` for "active" — active is `success`
- ❌ Using Badge without a text label (icon-only Badge) — always include a label
