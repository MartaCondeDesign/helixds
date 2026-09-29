---
id: accordion-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, build an FAQ section with two questions — "How long does shipping take?" and "Can I
return an item?" — where each answer is hidden until the user opens that question. The first one
should start open.

# Success criteria

- [ ] Imports `Accordion` from `@helix-ds/core`
- [ ] Uses `label=` for each question (not `title=`, `header=`)
- [ ] Puts each answer as the Accordion's children (not `content=`)
- [ ] Starts the first one open with `defaultExpanded` (not `open`, `isOpen`)

# Escape hatches (partial credit)

- Uses controlled `expanded=` with `onExpandedChange=` instead of `defaultExpanded`

# Invalid patterns (auto-fail)

- `<details` — a hand-built disclosure instead of Accordion
- `isExpanded=` — anti-synonym for expanded

# Expected output shape

```tsx
import { Accordion } from '@helix-ds/core';

function Faq() {
  return (
    <>
      <Accordion label="How long does shipping take?" defaultExpanded>
        Orders ship within 3-5 business days.
      </Accordion>
      <Accordion label="Can I return an item?">
        Free returns within 30 days of delivery.
      </Accordion>
    </>
  );
}
```
