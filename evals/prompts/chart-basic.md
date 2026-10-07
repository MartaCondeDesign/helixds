---
id: chart-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, build a dashboard card that shows how weekly sign-ups evolved from Monday to Friday
(120, 135, 128, 160, 150), so people can see the trend at a glance.

# Success criteria

- [ ] Imports `Chart` from `@helixds/react`
- [ ] Shows a trend with a line-type chart (any of `variant="line"`, `variant="area"`)
- [ ] Gives the chart its accessible name with `label=` (not `title=`, `aria-label=`)
- [ ] Passes the axis labels as `categories=` and the values as `series=`
- [ ] Names each series with `name:` and its values with `data:`

# Escape hatches (partial credit)

- Wraps the chart in `Card` to compose the dashboard (Chart.json governance)
- Adds the takeaway with `description=`

# Invalid patterns (auto-fail)

- `echarts` — imports the charting engine directly instead of the Helix Chart
- `option=` — raw engine options; Chart only takes its documented props
- `recharts` — a different chart library outside Helix
- `onPress=` — anti-synonym for onClick

# Expected output shape

```tsx
import { Card, Chart } from '@helixds/react';

function WeeklySignups() {
  return (
    <Card header="Weekly sign-ups">
      <Chart
        variant="line"
        label="Weekly sign-ups"
        description="Sign-ups peaked on Thursday."
        categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
        series={[{ name: 'Sign-ups', data: [120, 135, 128, 160, 150] }]}
      />
    </Card>
  );
}
```
