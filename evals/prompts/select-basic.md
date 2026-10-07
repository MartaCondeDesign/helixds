---
id: select-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

Create a country picker using Helix DS with options for Spain, France, and Germany, that shows an
error message if the user tries to submit without picking one.

# Success criteria

- [ ] Imports `Select` from `@helix/react`
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
import { Select } from '@helix/react';

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
