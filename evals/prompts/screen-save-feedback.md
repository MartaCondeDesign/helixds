---
id: screen-save-feedback
category: screen
difficulty: medium
turns: 1
---

# Prompt

On the profile page, after someone saves their changes, let them know it worked without interrupting what they're doing, following our design system.

# Success criteria

- [ ] Imports from `@helixds/react`
- [ ] Confirms with a toast, `toast.success(`
- [ ] Mounts the toast container `<Toast` once
- [ ] Shows the save in progress on the button with `isLoading`
- [ ] Does NOT block the page with a `Modal` — a toast doesn't interrupt

# Invalid patterns (auto-fail)

- `alert(` — interrupts the user
- `loading={` — anti-synonym of isLoading

# Expected output shape

```tsx
import { useState } from 'react';
import { Button, Toast, toast } from '@helixds/react';

export function SaveProfile({ save }: { save: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  async function onSave() {
    setSaving(true);
    await save();
    setSaving(false);
    toast.success('Profile saved');
  }
  return (
    <>
      <Button variant="primary" isLoading={saving} onClick={onSave}>Save changes</Button>
      <Toast />
    </>
  );
}
```
