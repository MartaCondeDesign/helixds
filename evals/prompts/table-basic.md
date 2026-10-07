---
id: table-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, show a list of team members as a table with three columns: Name, Role and Last seen.

# Success criteria

- [ ] Imports `Table` from `@helixds/react`
- [ ] Puts the column headings in `TableHead` with `TableHeaderCell`
- [ ] Puts the data rows in `TableBody` with `TableRow` and `TableCell`
- [ ] Gives each row a stable `key={` from the data

# Escape hatches (partial credit)

- Wraps the table in a `Card` with `padding="none"` for an edge-to-edge look

# Invalid patterns (auto-fail)

- `<table` — a raw HTML table instead of Helix Table
- `<td` — raw cells instead of TableCell
- `boxShadow` — tables are flat content (ADR-005)

# Expected output shape

```tsx
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@helixds/react';

type Member = { id: string; name: string; role: string; lastSeen: string };

function MembersTable({ members }: { members: Member[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Last seen</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map(m => (
          <TableRow key={m.id}>
            <TableCell>{m.name}</TableCell>
            <TableCell>{m.role}</TableCell>
            <TableCell>{m.lastSeen}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```
