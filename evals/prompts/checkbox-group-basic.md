---
id: checkbox-group-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, let the user choose which notifications they want — Comments, Mentions, Weekly
digest — any number of them, under the heading "Notify me about".

# Success criteria

- [ ] Imports `CheckboxGroup` from `@helixds/react`
- [ ] Uses `label=` for the group heading (not `legend=`, `title=`)
- [ ] Passes the choices as `options=` with `value` and `label`
- [ ] Holds the selection as an array via `value=` and `onChange=`

# Escape hatches (partial credit)

- Adds `orientation="horizontal"` for short labels

# Invalid patterns (auto-fail)

- `<fieldset` — a hand-built group instead of CheckboxGroup
- `onValueChange=` — anti-synonym for onChange

# Expected output shape

```tsx
import { useState } from 'react';
import { CheckboxGroup } from '@helixds/react';

const OPTIONS = [
  { value: 'comments', label: 'Comments' },
  { value: 'mentions', label: 'Mentions' },
  { value: 'digest', label: 'Weekly digest' },
];

function NotificationPrefs() {
  const [selected, setSelected] = useState<string[]>(['comments']);
  return <CheckboxGroup label="Notify me about" options={OPTIONS} value={selected} onChange={setSelected} />;
}
```
