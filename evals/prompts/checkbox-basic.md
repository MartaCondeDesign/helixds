---
id: checkbox-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, add a required "I agree to the Terms of Service" checkbox to a sign-up form. If the
user submits without checking it, show the error "You must accept the terms to continue."

# Success criteria

- [ ] Imports `Checkbox` from `@helix/react`
- [ ] Uses `label=` for the visible text (not `text=`, `title=`)
- [ ] Marks it with `required` (not `isRequired`)
- [ ] Shows the error with `invalid=` and `errorMessage=` (not `hasError`, `error=`)
- [ ] Reads the new state from `onChange=` as a boolean

# Escape hatches (partial credit)

- Uses `checked=` controlled state (uncontrolled `defaultChecked` is also fine)

# Invalid patterns (auto-fail)

- `type="checkbox"` — a raw native checkbox instead of Checkbox
- `isChecked=` — anti-synonym for checked

# Expected output shape

```tsx
import { useState } from 'react';
import { Checkbox } from '@helix/react';

function TermsField({ submitted }: { submitted: boolean }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <Checkbox
      label="I agree to the Terms of Service"
      required
      checked={accepted}
      onChange={setAccepted}
      invalid={submitted && !accepted}
      errorMessage="You must accept the terms to continue."
    />
  );
}
```
