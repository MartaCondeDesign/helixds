---
name: search-filter
category: form
components: [Input, Button, Chip]
when: "Filtering a list or table with a search field + optional filter buttons."
---

# Pattern: Search + Filter

## When to use

- Tables/lists where the user needs to find items quickly
- Any collection with more than ~20 items

## Anatomy

```
┌────────────────────────────────────────────────────────────┐
│  🔍 Search projects…         [Status ▾] [Date ▾]  [Clear] │
│                                                            │
│  Active filters:  [Status: Active ×]  [Date: This week ×] │
└────────────────────────────────────────────────────────────┘
```

## Code

```tsx
import { useState } from 'react';
import { Input, Button, Chip } from '@helix-ds/core';
import { IconSearch, IconX } from '@tabler/icons-react';
// icon/iconEnd take the Tabler icon component by reference — never a pre-instantiated
// element like `icon={<IconSearch size={16} />}` — see root CLAUDE.md rule 2.
import type { ChipVariant } from '@helix-ds/core';

type ActiveFilter = { key: string; label: string; variant: ChipVariant };

function SearchFilter({
  placeholder = 'Search…',
  onSearch,
  filters,
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: {
  placeholder?: string;
  onSearch: (query: string) => void;
  filters?: React.ReactNode;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (key: string) => void;
  onClearAll?: () => void;
}) {
  const [query, setQuery] = useState('');
  const hasActive = (activeFilters?.length ?? 0) > 0;

  return (
    <div
      data-helix-pattern="search-filter"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}
    >
      {/* Search + filter controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)' }}>
        <Input
          label="Search"
          hideLabel
          icon={IconSearch}
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
          fullWidth
        />
        {filters}
        {hasActive && (
          <Button variant="ghost" icon={IconX} onPress={onClearAll}>
            Clear
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActive && (
        <div
          aria-label="Active filters"
          style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-50)', flexWrap: 'wrap' }}
        >
          {activeFilters?.map(f => (
            <Chip
              key={f.key}
              variant={f.variant}
              label={f.label}
              checked
              dismissible
              onDismiss={() => onRemoveFilter?.(f.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Rules

1. The search Input must have `label` (use `hideLabel` if visually hidden — still needed for a11y)
2. Active filter chips use the real `<Chip>` component (`checked` + `dismissible`/`onDismiss`) — not
   `<Badge>` (not interactive) and not a plain `<Button>` (Chip's whole `purpose` is "a compact selectable
   label for filters, categories, or short choices" — this is precisely that case; an earlier version of
   this doc predated Chip's existence and used Button instead, now corrected)
3. Clear all is `variant="ghost"` Button — it's a tertiary action
4. `aria-label="Active filters"` on the chip container is required for screen readers

## Anti-patterns

- ❌ Using `<Badge>` for active filter chips — they're not interactive; use `<Chip>`
- ❌ Using a plain `<Button>` for active filter chips — `<Chip>` already models `checked`/`dismissible`
  states with the right ARIA (`aria-pressed`, `aria-label="Dismiss {label}"`) for free
- ❌ Hiding the search label entirely with no `aria-label` fallback
- ❌ Triggering search on button click instead of `onChange` — users expect immediate filtering
