---
id: button-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Create a React component that renders a save button with a loading state using Helix DS.
The button should be a primary variant, medium size, and show a spinner while saving is in progress.

# Success criteria

- [ ] Imports `Button` from `@helix/react`
- [ ] Uses `variant="primary"` (not `type="primary"`)
- [ ] Passes a boolean to Button's `isLoading=` prop (not a `loading=` prop)
- [ ] Does NOT pass `onPress` — uses `onClick` instead
- [ ] Does NOT hardcode any colors or sizes
- [ ] Does NOT import `@helix/tokens/helix.css` in the component (goes in app entry)

# Escape hatches (partial credit)

- Uses `size="m"` explicitly (it's the default, so omitting is also fine)
- Adds an aria-label for icon-only button (correct, even if not required here)

# Invalid patterns (auto-fail)

- `type="primary"` or `kind="primary"` — anti-synonym
- `loading={true}` — anti-synonym
- `onPress={handleSave}` — anti-synonym
- `style={{ color: '#1d4ed8' }}` — hardcoded value
- Inventing a `ButtonSpinner` component that doesn't exist in Helix

# Expected output shape

```tsx
import { Button } from '@helix/react';

function SaveButton({ onSave, isSaving }: { onSave: () => void; isSaving: boolean }) {
  return (
    <Button
      variant="primary"
      isLoading={isSaving}
      onClick={onSave}
    >
      Save changes
    </Button>
  );
}
```
