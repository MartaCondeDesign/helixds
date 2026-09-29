---
id: switch-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, add an "Email notifications" setting that turns on or off immediately when toggled
(no Save button).

# Success criteria

- [ ] Imports `Switch` from `@helix-ds/core`
- [ ] Uses `label=` for the visible text
- [ ] Controls it with `checked=` and `onChange=` (not `isChecked=`)

# Escape hatches (partial credit)

- Adds a `description=` explaining what the setting does

# Invalid patterns (auto-fail)

- `<Checkbox` — a checkbox for an instant on/off setting; Switch is the immediate-effect control
- `role="switch"` — hand-rolling the switch instead of using Switch

# Expected output shape

```tsx
import { useState } from 'react';
import { Switch } from '@helix-ds/core';

function EmailNotificationsSetting() {
  const [enabled, setEnabled] = useState(true);
  return <Switch label="Email notifications" checked={enabled} onChange={setEnabled} />;
}
```
