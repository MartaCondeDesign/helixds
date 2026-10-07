---
id: chip-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, show the filters currently applied to a product list — "In stock", "On sale", "New" — as
chips the user can remove one by one.

# Success criteria

- [ ] Imports `Chip` from `@helixds/react`
- [ ] Uses `label` prop for the chip text (not `children`)
- [ ] Makes them removable with `dismissible` (not `removable=`, `closable=`)
- [ ] Removes a filter through `onDismiss` (not `onClose`, `onRemove`)

# Escape hatches (partial credit)

- Uses `variant="neutral"` explicitly (it's the default, so omitting is also fine)
- Spaces the chips `var(--helix-spacing-2xs)` apart (group-spacing.md)

# Invalid patterns (auto-fail)

- `<Chip>In stock</Chip>` — text as children instead of the label prop
- `checked=` — Chip has no checked/selected state
- `<ChipGroup` — invents props: ChipGroup's options have no dismissible/onDismiss, so its chips can't be removed
- `onPress=` on Chip — anti-synonym for onClick

# Expected output shape

```tsx
import { useState } from 'react';
import { Chip } from '@helixds/react';

function ActiveFilters() {
  const [filters, setFilters] = useState(['In stock', 'On sale', 'New']);
  return (
    <div style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)' }}>
      {filters.map(filter => (
        <Chip
          key={filter}
          label={filter}
          dismissible
          onDismiss={() => setFilters(prev => prev.filter(f => f !== filter))}
        />
      ))}
    </div>
  );
}
```
