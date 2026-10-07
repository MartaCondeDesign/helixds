---
id: multi-select-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Using Helix DS, let the user pick any number of skills — Design, Research, Frontend, Backend — from a
dropdown under the label "Skills", with the chosen ones visible in the field.

# Success criteria

- [ ] Imports `MultiSelect` from `@helixds/react`
- [ ] Uses `label=` for the field label (not `title=`)
- [ ] Passes the choices as `options=` with `value` and `label`
- [ ] Holds the selection as an array via `value=` and `onChange=`
- [ ] Does NOT use `<Select` for several values — `MultiSelect` is the multi-value field

# Escape hatches (partial credit)

- Uses uncontrolled `defaultValue=` instead of value/onChange

# Invalid patterns (auto-fail)

- `multiple` — no multiple prop; MultiSelect is its own component
- `<select` — a native select
- `<CheckboxGroup` — for a dropdown with chips, not an always-visible list

# Expected output shape

```tsx
import { useState } from 'react';
import { MultiSelect } from '@helixds/react';

const SKILLS = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
];

function SkillsField() {
  const [skills, setSkills] = useState<string[]>([]);
  return <MultiSelect label="Skills" options={SKILLS} value={skills} onChange={setSkills} placeholder="Choose skills…" />;
}
```
