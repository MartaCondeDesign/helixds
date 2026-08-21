---
name: search-filter
category: form
components: [Input, Button, Badge]
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
import { Input, Button, Badge } from '@helix-ds/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import type { BadgeVariant } from '@helix-ds/core';

type ActiveFilter = { key: string; label: string; variant: BadgeVariant };

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
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-3)' }}
    >
      {/* Search + filter controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-2)' }}>
        <Input
          label="Search"
          hideLabel
          icon={<IconSearch size={16} />}
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
          fullWidth
        />
        {filters}
        {hasActive && (
          <Button variant="ghost" icon={<IconX size={14} />} onPress={onClearAll}>
            Clear
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActive && (
        <div
          aria-label="Active filters"
          style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-2)', flexWrap: 'wrap' }}
        >
          {activeFilters?.map(f => (
            <Button
              key={f.key}
              variant="secondary"
              size="xs"
              iconEnd={<IconX size={12} />}
              onPress={() => onRemoveFilter?.(f.key)}
              aria-label={`Remove filter: ${f.label}`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Rules

1. The search Input must have `label` (use `hideLabel` if visually hidden — still needed for a11y)
2. Active filter chips use `variant="secondary"` Button with `iconEnd={<IconX />}` — not a Badge (they must be interactive)
3. Clear all is `variant="ghost"` — it's a tertiary action
4. `aria-label="Active filters"` on the chip container is required for screen readers

## Anti-patterns

- ❌ Using `<Badge>` for active filter chips — they're not interactive; use `<Button>`
- ❌ Hiding the search label entirely with no `aria-label` fallback
- ❌ Triggering search on button click instead of `onChange` — users expect immediate filtering
