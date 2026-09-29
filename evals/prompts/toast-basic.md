---
id: toast-basic
category: component-selection
difficulty: medium
turns: 1
---

# Prompt

Using Helix DS, after the user saves their profile, briefly confirm "Profile saved" with the detail
"Your changes are live." in a temporary notification that disappears on its own.

# Success criteria

- [ ] Imports `Toast` from `@helix-ds/core` and renders `<Toast />` once
- [ ] Fires the notification with `toast.success(` (not `toast.show(`, `toast(`)
- [ ] Passes the detail `Your changes are live.` as the second argument (a string, or { description })

# Escape hatches (partial credit)

- Mounts `<Toast />` once at the app root rather than next to the button

# Invalid patterns (auto-fail)

- `setTimeout(` — hand-rolling the auto-dismiss Toast already does
- `role="status"` — a hand-built notification

# Expected output shape

```tsx
import { Toast, Button, toast } from '@helix-ds/core';

function SaveProfile({ onSave }: { onSave: () => Promise<void> }) {
  return (
    <>
      <Button
        variant="primary"
        onPress={async () => {
          await onSave();
          toast.success('Profile saved', 'Your changes are live.');
        }}
      >
        Save
      </Button>
      <Toast />
    </>
  );
}
```
