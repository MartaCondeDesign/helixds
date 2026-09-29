---
id: avatar-group-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Show the members assigned to a project card using Helix DS: a compact overlapping stack of their
avatars, showing at most 3 and collapsing the rest into a "+N" count.

# Success criteria

- [ ] Imports `AvatarGroup` from `@helix-ds/core`
- [ ] Passes the people through the `avatars=` prop (not `users=`, `members=`, `items=`)
- [ ] Each entry gives the person's name as `label:`
- [ ] Uses `max={3}` to collapse the overflow into "+N"

# Escape hatches (partial credit)

- Passes `src` for people who have a photo (initials fallback is also fine)
- Sets `size="s"` for a dense card

# Invalid patterns (auto-fail)

- `<Avatar ` rendered one by one in a map — AvatarGroup owns the stack and the "+N" overflow
- `size="sm"` — the size scale is s / m / l
- `limit=` — the prop is max

# Expected output shape

```tsx
import { AvatarGroup } from '@helix-ds/core';

type Member = { fullName: string; photoUrl?: string };

function ProjectMembers({ team }: { team: Member[] }) {
  return (
    <AvatarGroup
      avatars={team.map(m => ({ label: m.fullName, src: m.photoUrl }))}
      max={3}
      size="s"
    />
  );
}
```
