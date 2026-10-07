---
id: modal-basic
category: component-selection
difficulty: medium
turns: 1
---

# Prompt

Using Helix DS, when the user presses "Delete project", ask for confirmation in a dialog titled
"Delete project" that says the action can't be undone, with a "Delete" confirm action and a
"Cancel" action.

# Success criteria

- [ ] Imports `Modal` from `@helixds/react`
- [ ] Opens it with `expanded=` (not `open=`, `isOpen=`)
- [ ] Closes it through `onDismiss=` (not `onClose=`)
- [ ] Uses `label=` for the dialog title (not `title=`)
- [ ] Uses the built-in footer actions `primaryActionLabel=` and `secondaryActionLabel=`

# Escape hatches (partial credit)

- Handles the confirm with `onPrimaryAction=`

# Invalid patterns (auto-fail)

- `<dialog` — a hand-built dialog instead of Modal
- `role="dialog"` — a hand-rolled dialog

# Expected output shape

```tsx
import { useState } from 'react';
import { Modal, Button } from '@helixds/react';

function DeleteProject({ onDelete }: { onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setExpanded(true)}>Delete project</Button>
      <Modal
        label="Delete project"
        expanded={expanded}
        onDismiss={() => setExpanded(false)}
        primaryActionLabel="Delete"
        onPrimaryAction={() => {
          onDelete();
          setExpanded(false);
        }}
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setExpanded(false)}
      >
        This can’t be undone. The project and all its data will be permanently removed.
      </Modal>
    </>
  );
}
```
