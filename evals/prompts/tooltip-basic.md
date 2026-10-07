---
id: tooltip-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

A toolbar has an icon-only "Archive" button. Using Helix DS, show a short "Archive" hint when the
user hovers or focuses it.

# Success criteria

- [ ] Imports `Tooltip` from `@helixds/react`
- [ ] Uses `label` prop for the tooltip text (not `content`, `title`, `text`)
- [ ] Wraps the trigger directly as its child: `<Tooltip` around `<IconButton`
- [ ] The wrapped IconButton keeps its own `label` accessible name

# Escape hatches (partial credit)

- Sets `placement="bottom"` for a top-of-page toolbar (the default `top` auto-flips anyway)

# Invalid patterns (auto-fail)

- `open=` — anti-synonym for expanded; hover/focus drive visibility on their own
- `onMouseEnter=` — Tooltip already handles hover and focus
- `title=` — native title attribute instead of Tooltip

# Expected output shape

```tsx
import { Tooltip, IconButton } from '@helixds/react';
import { IconArchive } from '@tabler/icons-react';

function ArchiveAction({ onArchive }: { onArchive: () => void }) {
  return (
    <Tooltip label="Archive" placement="bottom">
      <IconButton icon={IconArchive} label="Archive" onClick={onArchive} />
    </Tooltip>
  );
}
```
