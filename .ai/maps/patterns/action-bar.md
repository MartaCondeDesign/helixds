---
name: action-bar
category: navigation
components: [Button]
when: "A horizontal group of actions — page-level CTAs, toolbar, table batch actions."
---

# Pattern: Action Bar

## When to use

- Page header actions (Create, Export, Filter)
- Table batch-selection actions (Delete selected, Move to…)
- Toolbar in a rich editor or data grid
- Footer of a dialog/panel

## Anatomy

```
Page header:
┌──────────────────────────────────────────────────────┐
│  Projects                    [Import] [New project ▸] │
└──────────────────────────────────────────────────────┘

Batch actions (appears when rows are selected):
┌──────────────────────────────────────────────────────┐
│  3 selected   [Archive]  [Move to…]  [Delete]        │
└──────────────────────────────────────────────────────┘
```

## Button role hierarchy (enforce this order)

| Position | Variant     | Use case                             |
|----------|-------------|--------------------------------------|
| Last     | `primary`   | The main CTA — one per bar maximum   |
| Middle   | `secondary` | Secondary actions                    |
| Any      | `ghost`     | Tertiary, often icon-only            |
| Isolated | `danger`    | Destructive — separate from the rest by a gap |

## Code

```tsx
import { Button } from '@helix-ds/core';
import { IconPlus, IconUpload, IconTrash } from '@tabler/icons-react';

/* Page header action bar */
function PageActions({ onNew, onImport }: { onNew: () => void; onImport: () => void }) {
  return (
    <div
      data-helix-pattern="action-bar"
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-2)' }}
    >
      <Button variant="secondary" icon={<IconUpload size={16} />} onPress={onImport}>
        Import
      </Button>
      <Button variant="primary" icon={<IconPlus size={16} />} onPress={onNew}>
        New project
      </Button>
    </div>
  );
}

/* Batch action bar with destructive action separated */
function BatchActions({
  count,
  onArchive,
  onMove,
  onDelete,
}: {
  count: number;
  onArchive: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      data-helix-pattern="action-bar"
      role="toolbar"
      aria-label="Batch actions"
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        'var(--helix-primitive-spacing-2)',
      }}
    >
      <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-light)' }}>
        {count} selected
      </span>

      <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-1)' }}>
        <Button variant="ghost" onPress={onArchive}>Archive</Button>
        <Button variant="ghost" onPress={onMove}>Move to…</Button>
      </div>

      {/* Danger is separated by a larger gap */}
      <div style={{ marginLeft: 'var(--helix-primitive-spacing-4)' }}>
        <Button
          variant="danger"
          icon={<IconTrash size={16} />}
          onPress={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
```

## Rules

1. Maximum one `primary` button per bar — it signals the most important action
2. Danger button must be visually separated (extra margin, or positioned at the opposite end)
3. Icon-only buttons must have `aria-label` on the Button element itself
4. `role="toolbar"` when the bar contains 3+ interactive elements

## Anti-patterns

- ❌ Two `primary` buttons side by side — one primary maximum
- ❌ `danger` button immediately adjacent to `primary` without a gap — users will misclick
- ❌ Putting destructive action first/leftmost — it's read last, not first
- ❌ `ghost` for the main CTA in a toolbar — it disappears visually

## Tokens used

- `--helix-primitive-spacing-2` — default gap between buttons
- `--helix-primitive-spacing-4` — separation gap before danger button
