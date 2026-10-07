---
id: avatar-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, show a team member's profile picture next to their name in a members list. Some members
have no photo yet, so those should fall back to their initials.

# Success criteria

- [ ] Imports `Avatar` from `@helixds/react`
- [ ] Passes the person's full name with `label=` (not `name=`, `alt=`, `title=`)
- [ ] Passes the photo URL with `src=` (not `image=`, `url=`)
- [ ] Does NOT compute initials by hand with `initials=` or `.split(' ')` — Avatar derives them from `label`

# Escape hatches (partial credit)

- Sets `size="s"` for a dense list row (the default `m` is also fine)

# Invalid patterns (auto-fail)

- `<img` — a raw image instead of Avatar, which also loses the initials fallback
- `fallback=` — no such prop; the initials fallback is automatic

# Expected output shape

```tsx
import { Avatar } from '@helixds/react';

type Member = { id: string; fullName: string; photoUrl?: string };

function MemberAvatar({ member }: { member: Member }) {
  return <Avatar label={member.fullName} src={member.photoUrl} size="s" />;
}
```
