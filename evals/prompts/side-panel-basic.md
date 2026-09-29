---
id: side-panel-basic
category: component-selection
difficulty: medium
turns: 1
---

# Prompt

Using Helix DS, show an "Edit filters" panel that slides in from the right edge when the user
presses a "Filters" button, and can be dismissed.

# Success criteria

- [ ] Imports `SidePanel` from `@helix-ds/core`
- [ ] Opens it with `expanded=` (not `open=`, `isOpen=`)
- [ ] Closes it through `onDismiss=` (not `onClose=`)
- [ ] Uses `label=` for the panel title (not `title=`)

# Escape hatches (partial credit)

- Passes `placement="right"` explicitly (it's already the default)

# Invalid patterns (auto-fail)

- `<Modal` — a centered modal for a side-anchored panel
- `<aside` — a hand-built panel instead of SidePanel

# Expected output shape

```tsx
import { useState } from 'react';
import { SidePanel, Button } from '@helix-ds/core';
import { IconFilter } from '@tabler/icons-react';

function FiltersPanel() {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <Button variant="secondary" icon={IconFilter} onPress={() => setExpanded(true)}>Filters</Button>
      <SidePanel label="Edit filters" expanded={expanded} onDismiss={() => setExpanded(false)} placement="right">
        Filter builder content goes here.
      </SidePanel>
    </>
  );
}
```
