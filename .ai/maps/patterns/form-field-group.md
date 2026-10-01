---
name: form-field-group
category: form
components: [Input, Button, Badge]
when: "A form with 2-6 fields, a submit action, and optional inline validation."
---

# Pattern: Form Field Group

## When to use

- Login, registration, settings, create/edit forms
- Up to ~6 fields visible at once (beyond that, consider multi-step)

## Anatomy

```
┌─────────────────────────────────────────┐
│  [Badge variant="danger"]               │  Auth error — only when submit fails
│                                         │
│  Email *                                │  Input, required
│  ┌─────────────────────────────────┐    │
│  │  you@example.com                │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Password *                             │  Input, required, type="password"
│  ┌─────────────────────────────────┐    │
│  │  ••••••••                       │    │
│  └─────────────────────────────────┘    │
│  Min. 8 characters                      │  description prop
│                                         │
│  [Cancel]      [Sign in ↗]             │  Button secondary + primary
└─────────────────────────────────────────┘
```

## Components used

| Component | Role                                          |
|-----------|-----------------------------------------------|
| Input     | All form fields                               |
| Button    | Submit (primary) + Cancel/secondary (secondary)|
| Badge     | Top-level form error after failed submit      |

## Code

```tsx
import { useState } from 'react';
import { Input, Button, Badge } from '@helix-ds/core';
import { IconMail, IconLock } from '@tabler/icons-react';

function LoginForm({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => Promise<void> }) {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setEmailInvalid(false);

    if (!email.includes('@')) {
      setEmailInvalid(true);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({ email, password });
    } catch {
      setFormError('Incorrect email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-125)', maxWidth: '360px' }}>

      {formError && (
        <Badge variant="danger" label={formError} />
      )}

      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        icon={IconMail}
        value={email}
        onChange={e => setEmail(e.target.value)}
        invalid={emailInvalid}
        errorMessage="Enter a valid email address"
        fullWidth
      />

      <Input
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        icon={IconLock}
        description="Min. 8 characters"
        value={password}
        onChange={e => setPassword(e.target.value)}
        fullWidth
      />

      <div style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)', justifyContent: 'flex-end' }}>
        <Button variant="secondary" type="button" onPress={() => {}}>Cancel</Button>
        <Button variant="primary" type="submit" loading={isLoading}>Sign in</Button>
      </div>
    </form>
  );
}
```

## Rules

1. One primary button maximum per form
2. Cancel is always `variant="secondary"`, not ghost (ghost is invisible in context)
3. Form-level errors → `Badge variant="danger"` at top
4. Field-level errors → `errorMessage` prop on Input with `invalid` state
5. Always use `required` + `aria-required` via the Input's `required` prop
6. Never disable the submit button to prevent submission — use `loading` + server validation

## Anti-patterns

- ❌ `<input className="border border-red-500" />` — use `<Input invalid errorMessage="..." />`
- ❌ Generic `<div style={{ color: 'red' }}>Error</div>` — use `<Badge variant="danger" />`
- ❌ `isLoading` prop — use `loading`
- ❌ `onClick` on Button — use `onPress`
- ❌ `type="primary"` — use `variant="primary"`

## Tokens used

- `--helix-primitive-spacing-5` — gap between fields
- `--helix-primitive-spacing-3` — gap between action buttons
