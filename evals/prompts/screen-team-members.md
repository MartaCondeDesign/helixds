---
id: screen-team-members
category: screen
difficulty: medium
turns: 1
---

# Prompt

Build the team page: a title, a button to invite someone new, and the list of current members with their name, email and role, following our design system.

# Success criteria

- [ ] Imports from `@helixds/react`
- [ ] The title and its action sit in a `PageHeader` with the invite button in `actions`
- [ ] The members are a `Table` (not a hand-built grid)
- [ ] The table has header cells, `TableHeaderCell`
- [ ] The invite action is a `Button`
- [ ] Does NOT build the list with `<table` or `display: 'grid'`

# Invalid patterns (auto-fail)

- `title=` on the page header — anti-synonym of label
- `<table` — a raw table instead of the design system's

# Expected output shape

```tsx
import { Button, PageHeader, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@helixds/react';

const MEMBERS = [
  { id: 1, name: 'Ana López', email: 'ana@example.com', role: 'Admin' },
  { id: 2, name: 'Marc Dubois', email: 'marc@example.com', role: 'Editor' },
];

export function TeamPage({ onInvite }: { onInvite: () => void }) {
  return (
    <>
      <PageHeader label="Team" description="People with access to this workspace"
        actions={<Button variant="primary" onClick={onInvite}>Invite member</Button>} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {MEMBERS.map(m => (
            <TableRow key={m.id}>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>{m.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
```
