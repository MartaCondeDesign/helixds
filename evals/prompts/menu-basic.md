---
id: menu-basic
category: component-selection
difficulty: hard
turns: 1
---

# Prompt

Using Helix DS, build a "Sort by" button above a table. Pressing it opens a list with three choices —
Name, Last seen, Role — and picking one sets the sort and closes the list. The trigger must stay a
Button labelled "Sort by", so a regular form Select doesn't fit.

# Success criteria

- [ ] Imports `Menu` from `@helixds/react`
- [ ] Opens and closes it with `expanded=` (not `open=`, `isOpen=`)
- [ ] Positions it against the trigger with `anchorRef=`
- [ ] Handles the choice with Menu's own `onSelect=`
- [ ] Passes the choices as `options=` objects with `value` and `label`
- [ ] Links the trigger to the list with `aria-controls=` and `aria-expanded=`
- [ ] Uses Helix `Button` with `onClick=` as the trigger (not `onPress=`)

# Escape hatches (partial credit)

- Highlights the current sort with `value=`

# Invalid patterns (auto-fail)

- `<ul` — a hand-built list instead of Menu
- `<select` — a native select, which can't keep the "Sort by" button as its trigger

# Expected output shape

```tsx
import { useId, useRef, useState } from 'react';
import { Button, Menu } from '@helixds/react';
import { IconArrowsSort } from '@tabler/icons-react';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'lastSeen', label: 'Last seen' },
  { value: 'role', label: 'Role' },
];

function SortMenu({ sort, onSortChange }: { sort: string; onSortChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        icon={IconArrowsSort}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={menuId}
        onClick={() => setExpanded(e => !e)}
      >
        Sort by
      </Button>
      <Menu
        id={menuId}
        expanded={expanded}
        anchorRef={triggerRef}
        options={SORT_OPTIONS}
        value={sort}
        onSelect={value => {
          onSortChange(value);
          setExpanded(false);
        }}
      />
    </>
  );
}
```
