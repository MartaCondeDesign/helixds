---
id: fab-basic
category: component-selection
difficulty: medium
turns: 1
---

# Prompt

Add a floating "create" button to a documents screen using Helix DS. Pressing it should reveal three
related actions: new document, new folder, and upload file.

# Success criteria

- [ ] Imports `FAB` from `@helixds/react`
- [ ] Passes the trigger icon by reference with `icon={Icon` (not `icon={<`)
- [ ] Uses `label` prop for the trigger's accessible name (not `aria-label`, `title`)
- [ ] Uses the `actions` prop for the speed-dial items (not `items`, `options`)
- [ ] Each action uses `onClick` (not `onPress`)

# Escape hatches (partial credit)

- Controls the speed-dial with `expanded` + `onExpandedChange` (uncontrolled is also fine)
- Positions the FAB via `className` — FAB never positions itself

# Invalid patterns (auto-fail)

- `open=` — anti-synonym for expanded
- `isOpen=` — anti-synonym for expanded
- `<IconButton` stacked by hand to fake a speed-dial — FAB's actions prop already models it

# Expected output shape

```tsx
import { FAB } from '@helixds/react';
import { IconPlus, IconFileText, IconFolderPlus, IconUpload } from '@tabler/icons-react';

function DocumentsCreateFAB({
  onNewDocument,
  onNewFolder,
  onUpload,
}: {
  onNewDocument: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
}) {
  return (
    <FAB
      icon={IconPlus}
      label="Create"
      actions={[
        { icon: IconFileText, label: 'New document', onClick: onNewDocument },
        { icon: IconFolderPlus, label: 'New folder', onClick: onNewFolder },
        { icon: IconUpload, label: 'Upload file', onClick: onUpload },
      ]}
      className="documents-create-fab" // fixed position set in the screen's own CSS
    />
  );
}
```
