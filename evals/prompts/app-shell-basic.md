---
id: app-shell-basic
category: layout
difficulty: hard
turns: 1
---

# Prompt

Using Helix DS, lay out an admin app's page frame: a sidebar on the left with links to Dashboard and
Team (Team is current), a top bar with a search field on the left and a Notifications icon button on
the right, and the page content — a "Team" page header — in the main area.

# Success criteria

- [ ] Imports `AppShell` from `@helix/react`
- [ ] Passes a `SideNav` through the `sidenav=` slot (not `sidebar=`)
- [ ] Passes a `TopBar` through the `topbar=` slot (not `header=`)
- [ ] Puts the page content as AppShell's children, starting with `PageHeader`
- [ ] Marks the current link with `current` (not `active`, `isActive`)
- [ ] Does NOT shrink a control below its row with `size="s"` — top bar controls share one size (same-row-sizing.md)

# Escape hatches (partial credit)

- Adds a `brand=` to the SideNav

# Invalid patterns (auto-fail)

- `display: 'grid'` — hand-building the frame instead of using AppShell
- `<aside` — a hand-built sidebar
- `<main` — AppShell already renders the main landmark

# Expected output shape

```tsx
import { AppShell, SideNav, NavItem, TopBar, Input, IconButton, PageHeader } from '@helix/react';
import { IconLayoutDashboard, IconUsers, IconSearch, IconBell } from '@tabler/icons-react';

function AdminFrame() {
  return (
    <AppShell
      sidenav={
        <SideNav brand={<strong>Acme</strong>}>
          <NavItem label="Dashboard" href="/dashboard" icon={IconLayoutDashboard} />
          <NavItem label="Team" href="/team" icon={IconUsers} current />
        </SideNav>
      }
      topbar={
        <TopBar
          start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" size="m" />}
          end={<IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />}
        />
      }
    >
      <PageHeader label="Team" description="Manage members and their access." />
    </AppShell>
  );
}
```
