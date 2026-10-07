---
id: card-basic
category: component-selection
difficulty: medium
turns: 1
---

# Prompt

Using Helix DS, put the "Recent invoices" table inside a card on a dashboard. The card has the title
"Recent invoices" at the top, and the table should run edge to edge inside the card.

# Success criteria

- [ ] Imports `Card` from `@helix/react`
- [ ] Puts the title in the `header=` slot (not `title=`)
- [ ] Removes the body padding for the edge-to-edge table with `padding="none"`
- [ ] Does NOT add elevation with `boxShadow` or `shadow` — Card is flat (ADR-005), `Card` alone is enough

# Escape hatches (partial credit)

- Adds a trailing action next to the title inside `header=` (e.g. a ghost "View all" Button)

# Invalid patterns (auto-fail)

- `elevation=` — no such prop; Helix is a flat design
- `border:` — hand-drawing the card's border instead of using Card

# Expected output shape

```tsx
import { Card, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@helix/react';

type Invoice = { id: string; customer: string; amount: string };

function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card header={<h2>Recent invoices</h2>} padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map(inv => (
            <TableRow key={inv.id}>
              <TableCell>{inv.customer}</TableCell>
              <TableCell>{inv.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
```
