---
id: segmented-control-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, add a compact Day / Week / Month switcher above a chart; exactly one period is
active at a time and changing it updates the chart right away.

# Success criteria

- [ ] Imports `SegmentedControl` from `@helix-ds/core`
- [ ] Names the group with `label=` for screen readers
- [ ] Passes the periods as `options=` with `value` and `label`
- [ ] Holds the active period via `value=` and `onChange=` (not `onValueChange=`)

# Escape hatches (partial credit)

- Places it in a row of `s`-size controls (it has no size prop)

# Invalid patterns (auto-fail)

- `<RadioGroup` — a form radio list for an instant view switch
- `size=` — SegmentedControl has one fixed size

# Expected output shape

```tsx
import { useState } from 'react';
import { SegmentedControl } from '@helix-ds/core';

const PERIODS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function PeriodSwitcher({ onPeriodChange }: { onPeriodChange: (p: string) => void }) {
  const [period, setPeriod] = useState('week');
  return (
    <SegmentedControl
      label="Period"
      options={PERIODS}
      value={period}
      onChange={p => {
        setPeriod(p);
        onPeriodChange(p);
      }}
    />
  );
}
```
