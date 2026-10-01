---
name: view-toggle
category: layout
components: [IconButton]
when: "Letting the user switch how the same data is displayed — e.g. table vs. cards."
---

# Pattern: View toggle

**Not a component** — same status as `stat-card.md`. A copy-paste recipe built from `IconButton`, not a
new formal DS primitive. Two buttons and a `useState` don't earn a contract of their own; commissioning a
`SegmentedControl`/`ToggleGroup` component is a separate, larger decision (grouped-selection semantics,
`role="radiogroup"` or `role="tablist"`, keyboard arrow navigation) — do that only when a second, unrelated
use case needs the same grouped-exclusive-choice behavior, not for one view switch.

## When to use

- The same underlying data can be usefully displayed two (rarely three) different ways — a dense table for
  scanning, a card grid for visual browsing.

## Anatomy

```
┌──────────────┐
│ [▤] [▦]      │   ← two IconButtons, one active (variant="secondary"), one not (variant="ghost")
└──────────────┘
```

## Code

```tsx
import { useState } from 'react';
import { IconButton } from '@helix-ds/core';
import { IconTable, IconLayoutGrid } from '@tabler/icons-react';

function ViewToggle({ view, onViewChange }: { view: 'table' | 'cards'; onViewChange: (v: 'table' | 'cards') => void }) {
  return (
    <div
      data-helix-pattern="view-toggle"
      role="group"
      aria-label="View"
      style={{ display: 'inline-flex', gap: 'var(--helix-spacing-2xs)' }}
    >
      <IconButton
        icon={IconTable}
        label="Table view"
        variant={view === 'table' ? 'secondary' : 'ghost'}
        aria-pressed={view === 'table'}
        onPress={() => onViewChange('table')}
      />
      <IconButton
        icon={IconLayoutGrid}
        label="Cards view"
        variant={view === 'cards' ? 'secondary' : 'ghost'}
        aria-pressed={view === 'cards'}
        onPress={() => onViewChange('cards')}
      />
    </div>
  );
}
```

## Rules

1. `role="group"` + `aria-label` on the wrapper — screen readers need to know these two buttons are related.
2. `aria-pressed` on each `IconButton` reflects whether that view is active — even though IconButton's own
   contract lists "a toggle/pressed state" under `neverUseFor` for a *single* icon button used in isolation,
   a pair of them forming a mutually-exclusive group is exactly the "compose a dedicated toggle control
   instead" escape hatch that rule points to. This recipe *is* that composition.
3. The active button uses `variant="secondary"` (visibly selected), the inactive one `variant="ghost"` —
   never both `ghost` (no way to tell which is active) or both `primary` (two competing CTAs).
4. State lives with whatever owns the data being displayed — don't let the toggle own its own disconnected
   state if the two views need to show the same underlying items (see
   `apps/storybook/stories/ReorderableTeamList.stories.tsx` for a worked example where both views share one
   ordering state).

## Anti-patterns

- ❌ Building a third, unused "list" view "just in case" — two options is the common case; add a third only
  when a real third display mode exists.
- ❌ Using `Chip` (`checked`) for this — Chip's purpose is filters/categories, not layout mode switching.
