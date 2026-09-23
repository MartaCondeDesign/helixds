/** Machine-readable component documentation for the Helix RadioButton. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'RadioButton',
  purpose: 'A single radio input — the same option unit RadioGroup renders per choice, exposed standalone.',
  contract: 'contracts/components/RadioButton.json',
  a11y: [
    'A real `<input type="radio">` — group it with siblings by giving them the same `name` for native arrow-key/mutual-exclusivity behavior.',
    'Prefer RadioGroup for an actual set of options — it wraps the same anatomy in a `<fieldset>`/`<legend>` for free. Reach for RadioButton only when you need one radio outside that structure.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'radio-control', label: 'Default fill', token: '--helix-radio-fill-default', kind: 'color' },
    { part: 'radio-control', label: 'Checked fill', token: '--helix-radio-fill-checked', kind: 'color' },
    { part: 'radio-control', label: 'Default border', token: '--helix-radio-border-default', kind: 'color' },
    { part: 'radio-control', label: 'Checked border', token: '--helix-radio-border-checked', kind: 'color' },
    { part: 'radio-control', label: 'Focus border', token: '--helix-radio-border-focus', kind: 'color' },
    { part: 'radio-control', label: 'Invalid border', token: '--helix-radio-border-invalid', kind: 'color' },
    { part: 'radio-dot', label: 'Selected dot color', token: '--helix-radio-dot', kind: 'color' },
  ],
  features: [
    'label — visible label',
    'name — shared with sibling RadioButtons for native mutual exclusivity; auto-generated (ungrouped) if omitted',
    'checked / defaultChecked / onChange — controlled or uncontrolled, same pattern as Switch',
    'description — helper text under the label',
    'invalid / disabled / required',
  ],
  examples: [
    { label: 'Basic', code: `<RadioButton label="Free" name="plan" value="free" defaultChecked />` },
    {
      label: 'Grouped by name',
      code: `<RadioButton label="Free" name="plan" value="free" />\n<RadioButton label="Pro" name="plan" value="pro" />`,
    },
  ],
};
