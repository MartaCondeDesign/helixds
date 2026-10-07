---
id: page-header-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, build the header of a "Team" page: the title "Team", a one-line description "Manage
members and their access.", and an "Invite member" primary button on the right.

# Success criteria

- [ ] Imports `PageHeader` from `@helixds/react`
- [ ] Uses `label="Team"` for the title (not `title=`, `heading=`)
- [ ] Uses `description=` for the supporting line (not `subtitle=`, `hint=`)
- [ ] Puts the button in the `actions=` slot
- [ ] The action is a `Button` with `variant="primary"`

# Escape hatches (partial credit)

- Passes `level={1}` explicitly (it is already the page-level default)

# Invalid patterns (auto-fail)

- `<h1` — a hand-built heading instead of PageHeader
- `onPress=` — anti-synonym for onClick

# Expected output shape

```tsx
import { PageHeader, Button } from '@helixds/react';
import { IconPlus } from '@tabler/icons-react';

function TeamHeader({ onInvite }: { onInvite: () => void }) {
  return (
    <PageHeader
      label="Team"
      description="Manage members and their access."
      actions={<Button variant="primary" icon={IconPlus} onClick={onInvite}>Invite member</Button>}
    />
  );
}
```
