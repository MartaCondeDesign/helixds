---
id: screen-signup-errors
category: screen
difficulty: medium
turns: 1
---

# Prompt

Build a sign-up form with email, password and country (Spain, France or Germany). When someone submits it with a field empty or the email malformed, show what's wrong right next to that field, following our design system.

# Success criteria

- [ ] Imports from `@helixds/react`
- [ ] Every field has a visible `label`
- [ ] Shows each error on the field itself with `invalid` and `errorMessage`
- [ ] The country is a `Select` with `options` (not `<option>` children)
- [ ] Submits with a `Button` (any of `onClick`, `type="submit"`)
- [ ] Does NOT hand-build the error text with `color: 'red'` or a raw `<p>` — uses `errorMessage` instead

# Invalid patterns (auto-fail)

- `hasError` or `isError` — anti-synonym of invalid
- `<option` — Select takes options, not children
- `error={` — anti-synonym of errorMessage

# Judge rubric

Judged by an LLM (`pnpm eval:judge`), blind to who wrote the answer. Never shown to the agent.

- error-at-field (critical): Each error is shown next to the field it is about, not only in a summary, banner or alert.
- error-says-fix (critical): Each message says what is wrong and how to fix it ("Enter a valid email, like name@example.com"), not just "Invalid" or "Error".
- no-premature-errors: Errors don't appear before the person has tried to submit (or has left the field).
- visible-labels: Every field has a visible label; a placeholder alone does not count.

# Expected output shape

```tsx
import { useState } from 'react';
import { Button, Input, Select } from '@helixds/react';

const COUNTRIES = [
  { value: 'es', label: 'Spain' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
];

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailError = !email ? 'Enter your email' : !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email, like name@example.com' : undefined;
  const passwordError = password ? undefined : 'Enter a password';
  const countryError = country ? undefined : 'Choose your country';

  return (
    <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
        invalid={submitted && !!emailError} errorMessage={submitted ? emailError : undefined} />
      <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
        invalid={submitted && !!passwordError} errorMessage={submitted ? passwordError : undefined} />
      <Select label="Country" options={COUNTRIES} value={country} onChange={setCountry} placeholder="Choose a country"
        invalid={submitted && !!countryError} errorMessage={submitted ? countryError : undefined} />
      <Button variant="primary" type="submit">Create account</Button>
    </form>
  );
}
```
