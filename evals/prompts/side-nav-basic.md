---
id: side-nav-basic
category: layout
difficulty: medium
turns: 1
---

# Prompt

Using Helix DS, build an app's left sidebar: the product name "Acme" at the top, three links
(Dashboard, Team, Settings) each with an icon, the current page being Team, and the signed-in user
pinned to the bottom.

# Success criteria

- [ ] Imports `SideNav` from `@helixds/react`
- [ ] Puts the product name in the `brand=` slot (not `logo=`, `header=`)
- [ ] Puts the signed-in user in the `footer=` slot
- [ ] Uses `NavItem` with a `label` and an `href` for each link
- [ ] Passes each icon by reference with `icon={Icon` (not `icon={<`)
- [ ] Marks the current page with `current` (not `active`, `isActive`, `selected`)
- [ ] Shows the user with `Avatar`

# Escape hatches (partial credit)

- Derives `current` from the router's path instead of hardcoding it

# Invalid patterns (auto-fail)

- `<nav` — a hand-built nav instead of SideNav
- `<a href` — raw links instead of NavItem
- `onPress=` — anti-synonym for onClick; navigation goes through href

# Expected output shape

```tsx
import { SideNav, NavItem, Avatar } from '@helixds/react';
import { IconLayoutDashboard, IconUsers, IconSettings } from '@tabler/icons-react';

function AppSideNav() {
  return (
    <SideNav
      brand={<strong>Acme</strong>}
      footer={<Avatar label="Marta Conde" size="s" />}
    >
      <NavItem label="Dashboard" href="/dashboard" icon={IconLayoutDashboard} />
      <NavItem label="Team" href="/team" icon={IconUsers} current />
      <NavItem label="Settings" href="/settings" icon={IconSettings} />
    </SideNav>
  );
}
```
