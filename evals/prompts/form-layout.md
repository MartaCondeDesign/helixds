---
id: form-layout
category: composition
difficulty: medium
turns: 1
---

# Prompt

Build a login form using Helix DS with:
- Email input (required, with validation)
- Password input
- Submit button (loading while authenticating)
- Error badge when authentication fails

# Success criteria

- [ ] Uses `Input` from `@helix/react` for both fields
- [ ] Input `label` prop provided (required for a11y)
- [ ] Error state uses `invalid` prop (not `hasError` or `isError`)
- [ ] Error message uses `errorMessage` prop on Input
- [ ] Uses `Badge` with `variant="danger"` for auth error (not a custom div)
- [ ] Submit button passes a boolean to `isLoading=` (not a `loading=` prop)
- [ ] No hardcoded color values anywhere

# Escape hatches (partial credit)

- Uses a custom `<form>` wrapper with aria attributes
- Adds `description` prop to inputs explaining format requirements

# Invalid patterns (auto-fail)

- `<div style={{ color: 'red' }}>Error</div>` — should use Badge
- `isError`, `hasError`, `error` as prop names — anti-synonyms
- `<input className="border-red-500" />` — should use Helix Input with invalid prop

# Expected output shape

```tsx
import { Input, Button, Badge } from '@helix/react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  return (
    <form>
      {authError && <Badge variant="danger" label={authError} />}

      <Input
        label="Email"
        type="email"
        required
        invalid={emailInvalid}
        errorMessage="Please enter a valid email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <Input
        label="Password"
        type="password"
        required
      />

      <Button isLoading={isLoading} onClick={handleSubmit}>
        Sign in
      </Button>
    </form>
  );
}
```
