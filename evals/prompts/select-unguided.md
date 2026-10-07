---
id: select-unguided
category: component-selection-unguided
difficulty: easy
turns: 1
---

<!-- Same criteria as select-basic, but the prompt describes the need instead of naming the component, variant or size — compare the two pass rates to see how much the agent relies on being told. -->

# Prompt

Our signup form needs the user to tell us which country they live in — Spain, France or Germany for now. If they submit without answering, tell them it's required. Build it with Helix DS.

# Success criteria

- [ ] Imports from `@helixds/react` and uses (any of `Select`, `RadioGroup`) — with only 3 options a radio group is a fair choice, and both share the props below
- [ ] Passes `options` as the list of choices (not `items` or `choices`)
- [ ] Uses `onChange` for value updates
- [ ] Uses `invalid` prop for the error state (not `hasError` or `isError`)
- [ ] Uses `errorMessage` prop for the error text (not a separate error element)
- [ ] Provides a `label` prop (required for a11y)

# Escape hatches (partial credit)

- Uses `defaultValue` for an uncontrolled variant instead of a controlled `value`
- Adds a `description` prop explaining the field

# Invalid patterns (auto-fail)

- `items=` or `choices=` as prop names — Select's canonical prop is options
- `hasError=` or `isError=` as prop names — anti-synonyms for invalid
- `<div className="error">` — should use the errorMessage prop instead of a custom element

# Expected output shape

```tsx
import { useState } from 'react';
import { Select } from '@helixds/react';

const COUNTRIES = [
  { value: 'es', label: 'Spain' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
];

function CountryPicker() {
  const [country, setCountry] = useState('');
  const [touched, setTouched] = useState(false);

  return (
    <Select
      label="Country"
      options={COUNTRIES}
      value={country}
      onChange={value => {
        setCountry(value);
        setTouched(true);
      }}
      placeholder="Select a country"
      invalid={touched && country === ''}
      errorMessage="Please select a country"
      required
    />
  );
}
```
