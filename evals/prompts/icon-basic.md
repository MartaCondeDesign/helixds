---
id: icon-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, add a small warning triangle icon in front of the text "Your trial ends in 3 days" in
a notice. The text already says everything, so the icon is purely visual.

# Success criteria

- [ ] Imports `Icon` from `@helix-ds/core`
- [ ] Passes the Tabler icon by reference with `icon={IconAlertTriangle}` (not `icon={<`)
- [ ] Sets a size from the scale with `size={16}`
- [ ] Colors it with a Helix icon token: `var(--helix-color-icon-`

# Escape hatches (partial credit)

- Passes `decorative` explicitly (it is already the default)

# Invalid patterns (auto-fail)

- `<IconAlertTriangle` — a Tabler icon rendered directly instead of through Icon
- `stroke=` — stroke is derived from size (ADR-017); never set per call site
- `color="#` — a hex literal; colors are always tokens

# Expected output shape

```tsx
import { Icon } from '@helix-ds/core';
import { IconAlertTriangle } from '@tabler/icons-react';

function TrialNotice() {
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)' }}>
      <Icon icon={IconAlertTriangle} size={16} color="var(--helix-color-icon-warning)" />
      Your trial ends in 3 days
    </p>
  );
}
```
