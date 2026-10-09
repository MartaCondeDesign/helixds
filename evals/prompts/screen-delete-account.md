---
id: screen-delete-account
category: screen
difficulty: medium
turns: 1
---

# Prompt

In the account settings screen, people can delete their account, and deletion can't be undone. Add a step that makes sure nobody deletes their account by accident, following our design system.

# Success criteria

- [ ] Imports from `@helixds/react`
- [ ] Asks for confirmation in a `Modal` (not the browser's `confirm(`)
- [ ] The modal opens and closes through `expanded` and `onDismiss`
- [ ] Offers a way back out (any of `secondaryActionLabel`, `showCloseButton`)
- [ ] The action that starts the deletion is a `variant="danger"` button
- [ ] Does NOT hand-build an overlay with `position: 'fixed'`

# Invalid patterns (auto-fail)

- `window.confirm` — the browser's dialog instead of the design system's
- `open={` or `isOpen={` on the modal — anti-synonym of expanded
- `onClose={` on the modal — anti-synonym of onDismiss

# Expected output shape

```tsx
import { useState } from 'react';
import { Button, Modal } from '@helixds/react';

export function DeleteAccount({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setConfirming(true)}>Delete account</Button>
      <Modal
        label="Delete your account?"
        expanded={confirming}
        onDismiss={() => setConfirming(false)}
        primaryActionLabel="Delete account"
        onPrimaryAction={() => { setConfirming(false); onDelete(); }}
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setConfirming(false)}
      >
        Your projects, files and billing history are deleted permanently. This can't be undone.
      </Modal>
    </>
  );
}
```
