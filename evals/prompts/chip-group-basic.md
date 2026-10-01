---
id: chip-group-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, add a row of filters above a project list so the user can show projects by status —
Active, Paused, Archived — any number of them at once, as chips, labelled "Status".

# Success criteria

- [ ] Imports `ChipGroup` from `@helix-ds/core`
- [ ] Uses `label=` for the group heading (not `legend=`, `title=`)
- [ ] Passes the filters as `options=` with `value` and `label`
- [ ] Holds the selection as an array via `value=` and `onChange=`

# Escape hatches (partial credit)

- Adds `hideLabel` when the row's purpose is clear from context

# Invalid patterns (auto-fail)

- `<fieldset` — a hand-built group instead of ChipGroup
- `onValueChange=` — anti-synonym for onChange
- `active=` — anti-synonym for checked

# Expected output shape

```tsx
import { useState } from 'react';
import { ChipGroup } from '@helix-ds/core';

const STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

function ProjectFilters() {
  const [filters, setFilters] = useState<string[]>([]);
  return <ChipGroup label="Status" options={STATUS} value={filters} onChange={setFilters} />;
}
```
