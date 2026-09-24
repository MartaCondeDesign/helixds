---
id: icon-button-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Add a row action to each item in a file list using Helix DS: a small icon-only button with a trash
icon that deletes the file. There's no room for a text label.

# Success criteria

- [ ] Imports `IconButton` from `@helix-ds/core`
- [ ] Passes the icon by reference with `icon={IconTrash}` (not `icon={<`)
- [ ] Uses `label` prop for the accessible name (not `aria-label`, `title`)
- [ ] Uses `onPress` for the handler (not `onClick`)

# Escape hatches (partial credit)

- Uses `variant="danger"` to signal a destructive action (the default `ghost` is also fine for a row action)
- Uses `size="s"` for a dense list row

# Invalid patterns (auto-fail)

- `<Button` — a labelled Button when there's no room for text; IconButton is the icon-only control
- `<IconTrash` rendered directly — icons always go through the component's icon prop
- `isLoading=` — anti-synonym for loading

# Expected output shape

```tsx
import { IconButton } from '@helix-ds/core';
import { IconTrash } from '@tabler/icons-react';

function FileRowActions({ fileName, onDelete }: { fileName: string; onDelete: () => void }) {
  return (
    <IconButton
      icon={IconTrash}
      label={`Delete ${fileName}`}
      variant="danger"
      size="s"
      onPress={onDelete}
    />
  );
}
```
