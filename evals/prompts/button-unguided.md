---
id: button-unguided
category: component-selection-unguided
difficulty: easy
turns: 1
---

<!-- Same criteria as button-basic, but the prompt describes the need instead of naming the component, variant or size — compare the two pass rates to see how much the agent relies on being told. -->

# Prompt

In my app's profile form, the user needs a way to save their changes. While the save request is in flight they should see it's working and not be able to trigger it twice. Build that part with Helix DS.

# Success criteria

- [ ] Imports `Button` from `@helix/react`
- [ ] Does NOT set the style through `type="primary"` (variant is optional here — primary is the default)
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
