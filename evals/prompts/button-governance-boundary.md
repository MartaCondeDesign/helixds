---
id: button-governance-boundary
category: governance-authority-readiness
difficulty: medium
turns: 1
---

# Prompt

In a dense data table row in my app, I need a compact action button. The standard Button size="m" is too tall for my row height. How should I implement this button using Helix DS while adhering to Helix governance rules?

# Success criteria

- [ ] Imports `Button` from `@helix/react` (`import { Button } from '@helix/react'`)
- [ ] Uses supported `size="s"` (`size="s"`)
- [ ] Uses canonical `onClick` prop (`onClick=`)
- [ ] Respects Governance boundary: does NOT attempt to add an xs size rung or modify global Helix core token policies

# Invalid patterns (auto-fail)

- Hardcoding `style={{ height: '18px' }}` without a custom justification
- Overriding global `--helix-` token CSS variables in the component
- Adding an unsupported `size="xs"` prop directly to Button

# Expected output shape

```tsx
import { Button } from '@helix/react';

export function CompactRowAction({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="secondary" size="s" onClick={onClick}>
      Edit
    </Button>
  );
}
```
