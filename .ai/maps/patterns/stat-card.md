---
name: stat-card
category: data-display
components: [Card, Icon]
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
│  MEMBERS              │
│  103                  │
│  ↗ +14                │
└───────────────────────┘
```

## Code

```tsx
import { Card, Icon } from '@helix-ds/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

type Trend = 'up' | 'down';

function StatCard({
  label, value, delta, trend,
}: { label: string; value: string; delta?: string; trend?: Trend }) {
  return (
    <Card>
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
        marginBottom:   'var(--helix-spacing-xs)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:    'var(--helix-textStyle-heading-3xl-bold-fontFamily)',
        fontSize:      'var(--helix-textStyle-heading-3xl-bold-fontSize)',
        fontWeight:    'var(--helix-textStyle-heading-3xl-bold-fontWeight)',
        lineHeight:    'var(--helix-textStyle-heading-3xl-bold-lineHeight)',
        letterSpacing: 'var(--helix-primitive-letterSpacing-tight)',
        color:         'var(--helix-color-text-neutral)',
        fontVariantNumeric: 'tabular-nums',
        marginBottom:  'var(--helix-spacing-xs)',
      }}>
        {value}
      </div>
      {delta && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        'var(--helix-spacing-3xs)', // 2px — arrow and delta read as one unit
          fontSize:   'var(--helix-textStyle-body-s-regular-fontSize)',
          fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
          color: trend === 'up'   ? 'var(--helix-color-text-success)'
               : trend === 'down' ? 'var(--helix-color-text-danger)'
               : 'var(--helix-color-text-neutral-light)',
        }}>
          {trend && (
            <Icon
              icon={trend === 'up' ? IconArrowUpRight : IconArrowDownRight}
              size={12}
              color={trend === 'up' ? 'var(--helix-color-icon-success)' : 'var(--helix-color-icon-danger)'}
            />
          )}
          {delta}
        </div>
      )}
    </Card>
  );
}
```

## Rules

1. `value` is a pre-formatted string from the consumer (`'103'`, `'89%'`) — this pattern never formats numbers itself
2. Omit `trend` to render `delta` as plain neutral text with no icon (e.g. a delta with no clear direction)
3. Lay several of these out with a real CSS grid (`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`), not `display: flex` with no basis — flex items without an explicit width just hug their own content, so cards end up different widths with no logic. See `apps/storybook/stories/Dashboard.stories.tsx`'s KPI row.
4. No shadow — Card is flat by design (see [ADR-005](../../docs/ADR/ADR-005-elevation-policy.md))

## Anti-patterns

- ❌ Reaching for a `StatCard` import — it doesn't exist; copy the code above
- ❌ Hardcoded px/hex values instead of the tokens shown above
- ❌ A `box-shadow` on the card to make it "pop" — see ADR-005
