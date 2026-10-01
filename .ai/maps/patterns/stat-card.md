---
name: stat-card
category: data-display
components: [Card, Badge]
when: "Showing a single labeled metric with an optional trend delta — a dashboard KPI, an analytics summary tile."
---

# Pattern: Stat Card

## When to use

- Dashboard KPI rows (Members, Revenue, Active users, ...)
- Analytics summary tiles
- Any "label + big number + optional up/down delta" widget

**This is a composition, not a component.** It used to be a standalone `StatCard` component; it was
folded back into a `Card` recipe because it has no anatomy, ARIA, or interaction of its own beyond what
`Card` already provides — it's `Card` plus a fixed internal text layout. There is nothing here that
justifies its own contract/tokens/export surface. Copy the code below into your own file rather than
expecting an import.

## Anatomy

```
┌───────────────────────┐
│  MEMBERS     [↗ +14]  │   ← delta Badge (xs) on the label's line, right-aligned
│  103                  │
└───────────────────────┘
```

## Code

```tsx
import { Card, Badge } from '@helix-ds/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

type Trend = 'up' | 'down';

function StatCard({
  label, value, delta, trend,
}: { label: string; value: string; delta?: string; trend?: Trend }) {
  return (
    <Card>
      {/* Header row: label on the left, delta Badge on the right, both centered on the label's line */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            'var(--helix-spacing-xs)',
        marginBottom:   'var(--helix-spacing-xs)',
      }}>
        <div style={{
          // semantic.textStyle.label-uppercase — its token description asks for text-transform +
          // letter-spacing at the call site, so both come from here (letter-spacing from its token).
          fontFamily:     'var(--helix-textStyle-label-uppercase-fontFamily)',
          fontSize:       'var(--helix-textStyle-label-uppercase-fontSize)',
          fontWeight:     'var(--helix-textStyle-label-uppercase-fontWeight)',
          lineHeight:     'var(--helix-textStyle-label-uppercase-lineHeight)',
          textTransform:  'uppercase',
          letterSpacing:  'var(--helix-primitive-letterSpacing-wide)',
          color:          'var(--helix-color-text-neutral-lightest)',
        }}>
          {label}
        </div>
        {delta && (
          // The delta is a Badge: success when up, danger when down, neutral with no trend — its icon slot
          // carries the trend arrow.
          <Badge
            variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'neutral'}
            size="xs"
            label={delta}
            {...(trend ? { icon: trend === 'up' ? IconArrowUpRight : IconArrowDownRight } : {})}
          />
        )}
      </div>
      <div style={{
        fontFamily:    'var(--helix-textStyle-heading-3xl-bold-fontFamily)',
        fontSize:      'var(--helix-textStyle-heading-3xl-bold-fontSize)',
        fontWeight:    'var(--helix-textStyle-heading-3xl-bold-fontWeight)',
        lineHeight:    'var(--helix-textStyle-heading-3xl-bold-lineHeight)',
        letterSpacing: 'var(--helix-primitive-letterSpacing-tight)',
        color:         'var(--helix-color-text-neutral)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </Card>
  );
}
```

## Rules

1. `value` is a pre-formatted string from the consumer (`'103'`, `'89%'`) — this pattern never formats numbers itself
2. The delta is a `Badge`: `success` + up arrow when `trend="up"`, `danger` + down arrow when `trend="down"`.
   Omit `trend` for a delta with no clear direction — a `neutral` Badge with no icon
3. Lay several of these out with a real CSS grid (`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`), not `display: flex` with no basis — flex items without an explicit width just hug their own content, so cards end up different widths with no logic. See `apps/storybook/stories/Dashboard.stories.tsx`'s KPI row.
4. No shadow — Card is flat by design (see [ADR-005](../../docs/ADR/ADR-005-elevation-policy.md))

## Anti-patterns

- ❌ Reaching for a `StatCard` import — it doesn't exist; copy the code above
- ❌ Hardcoded px/hex values instead of the tokens shown above
- ❌ The delta as loose colored text + a separate Icon — it's a Badge, which already pairs color, icon and text
- ❌ A `box-shadow` on the card to make it "pop" — see ADR-005
