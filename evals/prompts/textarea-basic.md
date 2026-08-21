---
id: textarea-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Create a "bio" field for a profile form using Helix DS, limited to 280 characters, showing a live
character counter.

# Success criteria

- [ ] Imports `Textarea` from `@helix-ds/core`
- [ ] Uses `maxLength` to cap the length
- [ ] Uses `showCount` to display the live counter (not a custom counter element)
- [ ] Provides a `label` prop (required for a11y)

# Escape hatches (partial credit)

- Sets `rows` explicitly to size the field
- Adds a `description` prop explaining the format

# Invalid patterns (auto-fail)

- Building a custom character counter with `{bio.length}` instead of showCount
- `<textarea` written directly instead of the Textarea component

# Expected output shape

```tsx
import { useState } from 'react';
import { Textarea } from '@helix-ds/core';

function BioField() {
  const [bio, setBio] = useState('');

  return (
    <Textarea
      label="Bio"
      value={bio}
      onChange={e => setBio(e.target.value)}
      maxLength={280}
      showCount
      rows={4}
      description="Tell people a bit about yourself"
    />
  );
}
```
