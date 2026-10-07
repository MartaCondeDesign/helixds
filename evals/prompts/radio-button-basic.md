---
id: radio-button-basic
category: component-selection
difficulty: medium
turns: 1
---

# Prompt

Using Helix DS, build a custom plan picker where each choice is laid out inside its own card, so you
can't use a ready-made group component. Render the individual "Free" and "Pro" radio controls, both
sharing the form name "plan".

# Success criteria

- [ ] Imports `RadioButton` from `@helix/react`
- [ ] Uses `label=` for each option's text
- [ ] Groups them with a shared `name="plan"`
- [ ] Controls the selection with `checked=` and `onChange=` (not `selected=`, `isChecked=`)

# Escape hatches (partial credit)

- Wraps each in a `Card`

# Invalid patterns (auto-fail)

- `type="radio"` — a raw native radio instead of RadioButton

# Expected output shape

```tsx
import { useState } from 'react';
import { RadioButton, Card } from '@helix/react';

function PlanCards() {
  const [plan, setPlan] = useState('free');
  return (
    <>
      <Card>
        <RadioButton label="Free" name="plan" value="free" checked={plan === 'free'} onChange={() => setPlan('free')} />
      </Card>
      <Card>
        <RadioButton label="Pro" name="plan" value="pro" checked={plan === 'pro'} onChange={() => setPlan('pro')} />
      </Card>
    </>
  );
}
```
