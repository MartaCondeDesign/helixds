---
id: top-bar-basic
category: layout
difficulty: medium
turns: 1
---

# Prompt

Using Helix DS, build an app's top bar: a search field on the left, and Notifications and Help
icon-only buttons on the right.

# Success criteria

- [ ] Imports `TopBar` from `@helix/react`
- [ ] Puts the search in the `start=` slot (not `left=`)
- [ ] Puts the icon buttons in the `end=` slot (not `right=`)
- [ ] Uses `Input` with `icon={IconSearch}` for the search
- [ ] Uses `IconButton` with a `label=` for each icon-only action
- [ ] Does NOT shrink a control below its row with `size="s"` — top bar controls share one size (same-row-sizing.md)

# Escape hatches (partial credit)

- Hides the search's visible label with `hideLabel` while keeping `label=` for screen readers

# Invalid patterns (auto-fail)

- `<header` — a hand-built bar instead of TopBar
- `<IconBell` — a Tabler icon rendered directly instead of through the icon prop
- `onPress=` — anti-synonym for onClick

# Expected output shape

```tsx
import { TopBar, Input, IconButton } from '@helix/react';
import { IconSearch, IconBell, IconHelp } from '@tabler/icons-react';

function AppTopBar({ query, onQueryChange }: { query: string; onQueryChange: (q: string) => void }) {
  return (
    <TopBar
      start={
        <Input
          label="Search"
          hideLabel
          icon={IconSearch}
          placeholder="Search…"
          size="m"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
        />
      }
      end={
        <>
          <IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />
          <IconButton variant="ghost" size="m" icon={IconHelp} label="Help" />
        </>
      }
    />
  );
}
```
