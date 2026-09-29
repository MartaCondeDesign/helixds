---
id: radio-group-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, let the user pick exactly one plan — Free, Pro or Team — under the heading "Plan".
A plan must be chosen before the form submits.

# Success criteria

- [ ] Imports `RadioGroup` from `@helix-ds/core`
- [ ] Uses `label=` for the heading
- [ ] Passes the plans as `options=` with `value` and `label`
- [ ] Holds the choice via `value=` and `onChange=`
- [ ] Marks it with `required` (not `isRequired`)

# Escape hatches (partial credit)

- Adds a `description` per option

# Invalid patterns (auto-fail)

- `type="radio"` — raw native radios instead of RadioGroup
- `<RadioButton` — single radios assembled by hand when RadioGroup already groups them

# Expected output shape

```tsx
import { useState } from 'react';
import { RadioGroup } from '@helix-ds/core';

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
];

function PlanPicker() {
  const [plan, setPlan] = useState('');
  return <RadioGroup label="Plan" options={PLANS} value={plan} onChange={setPlan} required />;
}
```
