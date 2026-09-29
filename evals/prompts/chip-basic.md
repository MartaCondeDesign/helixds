---
id: chip-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Create a set of toggleable filter chips for a product list — "In stock", "On sale", "New" — using
Helix DS, where the user can select any combination of them.

# Success criteria

- [ ] Imports `Chip` from `@helix-ds/core`
- [ ] Uses `label` prop for the chip text (not `children`)
- [ ] Uses `checked=` for the toggle state (not `active=`, `selected=`)
- [ ] Uses `onPress` for the toggle handler (not `onClick`)

# Escape hatches (partial credit)

- Uses `variant="neutral"` explicitly (it's the default, so omitting is also fine)
- Adds an `icon` for each filter category

# Invalid patterns (auto-fail)

- `<Chip>In stock</Chip>` — text as children instead of the label prop
- `active=` or `selected=` as prop names — anti-synonyms for checked
- `onClick=` on Chip — anti-synonym for onPress

# Expected output shape

```tsx
import { useState } from 'react';
import { Chip } from '@helix-ds/core';

const FILTERS = ['In stock', 'On sale', 'New'];

function ProductFilters() {
  const [checkedFilters, setCheckedFilters] = useState<Set<string>>(new Set());

  function toggle(filter: string) {
    setCheckedFilters(prev => {
      const next = new Set(prev);
      next.has(filter) ? next.delete(filter) : next.add(filter);
      return next;
    });
  }

  return (
    <>
      {FILTERS.map(filter => (
        <Chip
          key={filter}
          label={filter}
          checked={checkedFilters.has(filter)}
          onPress={() => toggle(filter)}
        />
      ))}
    </>
  );
}
```
