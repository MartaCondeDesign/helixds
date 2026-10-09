---
id: screen-notification-settings
category: screen
difficulty: easy
turns: 1
---

# Prompt

Add a section to the settings page where people choose how we notify them: by email, by push notification and by SMS. Each one can be turned on or off on its own and takes effect immediately, following our design system.

# Success criteria

- [ ] Imports from `@helixds/react`
- [ ] Each channel is a `Switch` (not a checkbox — the change applies immediately)
- [ ] Each switch has its own `label`
- [ ] Reads and changes the value with `checked` and `onChange`
- [ ] Groups the section under a heading (any of `Card`, `PageHeader`)
- [ ] Does NOT use `<input type="checkbox"` — uses `Switch` instead

# Invalid patterns (auto-fail)

- `isChecked` or `isOn` or `active={` — anti-synonym of checked
- `onToggle=` — anti-synonym of onChange

# Judge rubric

Judged by an LLM (`pnpm eval:judge`), blind to who wrote the answer. Never shown to the agent.

- instant-toggles (critical): Each channel is an on/off control that takes effect at once — there is no separate Save step.
- independent-channels (critical): Email, push and SMS are three independent controls, not one control for all.
- clear-labels: Each control's label names its channel plainly.
- grouped-section: The controls are grouped under one section heading.

# Expected output shape

```tsx
import { useState } from 'react';
import { Card, Switch } from '@helixds/react';

export function NotificationSettings() {
  const [channels, setChannels] = useState({ email: true, push: false, sms: false });
  const set = (key: keyof typeof channels) => (checked: boolean) => setChannels(c => ({ ...c, [key]: checked }));
  return (
    <Card header="Notifications">
      <Switch label="Email" description="Weekly summary and account alerts" checked={channels.email} onChange={set('email')} />
      <Switch label="Push notifications" checked={channels.push} onChange={set('push')} />
      <Switch label="SMS" checked={channels.sms} onChange={set('sms')} />
    </Card>
  );
}
```
