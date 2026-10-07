---
name: empty-state
category: feedback
components: [Badge, Button]
when: "The view has no data to display — first use, zero results, or filtered to nothing."
---

# Pattern: Empty State

## When to use

- Table/list has zero rows
- Search returned no results
- First-use onboarding (before the user has created anything)
- Permission-denied placeholder

## When NOT to use

- Loading state — use Skeleton instead
- Error state — use Error State pattern
- Single missing field — use inline field validation

## Anatomy

```
┌─────────────────────────────┐
│        [Illustration]       │  Optional: Tabler icon at 48px, color-icon-neutral-light
│                             │
│     No projects yet         │  font-size-xl, font-weight-semibold, text-neutral
│  Create your first project  │  font-size-s, text-neutral-light, max-width 320px
│                             │
│    [New project]  [Import]  │  Primary + Secondary buttons
└─────────────────────────────┘
```

## Components used

| Component | Role in pattern                           |
|-----------|-------------------------------------------|
| Button    | Primary CTA + optional secondary action   |
| Badge     | Optional context label (e.g. "Beta")      |

## Code

```tsx
import { Button } from '@helix/react';
import { IconFolderOpen } from '@tabler/icons-react';

function EmptyState({
  icon = <IconFolderOpen size={48} />,
  title,
  description,
  action,
  secondaryAction,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div
      data-helix-pattern="empty-state"
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            'var(--helix-primitive-spacing-100)',
        padding:        'var(--helix-primitive-spacing-12)',
        textAlign:      'center',
      }}
    >
      {icon && (
        <span style={{ color: 'var(--helix-color-text-neutral-light)' }} aria-hidden="true">
          {icon}
        </span>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-50)' }}>
        <h3 style={{
          fontSize:   'var(--helix-primitive-fontSize-xl)',
          fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
          color:      'var(--helix-color-text-neutral)',
          margin:     0,
        }}>
          {title}
        </h3>
        {description && (
          <p style={{
            fontSize:  'var(--helix-primitive-fontSize-s)',
            color:     'var(--helix-color-text-neutral-light)',
            maxWidth:  '320px',
            margin:    0,
          }}>
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)' }}>
          {action && (
            <Button variant="primary" onClick={action.onClick}>{action.label}</Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

## Anti-patterns

- ❌ Using a custom `<div className="text-gray-400">` for text — use `--helix-color-text-neutral-light`
- ❌ Hardcoding the icon color — always use a semantic token
- ❌ Multiple primary buttons — one primary CTA maximum
- ❌ Adding a button just because the pattern has one — omit if there's no meaningful action

## Tokens used

- `--helix-color-text-neutral-light` — icon and description text
- `--helix-color-text-neutral` — title text
- `--helix-primitive-spacing-*` — gap and padding
- `--helix-primitive-fontSize-xl` — title size
