---
id: chip-group-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, show a project's tags — Design, Research, Frontend — as a row of chips. Screen readers
should announce the row as "Tags".

# Success criteria

- [ ] Imports `ChipGroup` from `@helixds/react`
- [ ] Names the group with `label=` (not `legend=`, `title=`, `aria-label=`)
- [ ] Passes the tags as `options=` with `value` and `label`

# Escape hatches (partial credit)

- Adds `size="m"` to match a 32px toolbar row

# Invalid patterns (auto-fail)

- `checked=` — chips have no checked/selected state
- A hand-built `<div style={{ display: 'flex' }}>` of `<Chip>`s instead of ChipGroup

# Expected output shape

```tsx
import { ChipGroup } from '@helixds/react';

const TAGS = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'frontend', label: 'Frontend' },
];

function ProjectTags() {
  return <ChipGroup label="Tags" options={TAGS} />;
}
```
