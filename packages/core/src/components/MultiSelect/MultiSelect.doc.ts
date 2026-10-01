/** Machine-readable component documentation for the Helix MultiSelect. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'MultiSelect',
  purpose: 'Lets users choose several values from a predefined list, shown as removable chips inside the field.',
  contract: 'contracts/components/MultiSelect.json',
  a11y: [
    'The `label` prop is required. The combobox button owns focus and announces the selection ("2 selected: …").',
    'Same select-only combobox model as Select (ADR-013), with the Menu listbox in `multiple` mode (`aria-multiselectable`) — ADR-019.',
    'Enter/Space toggle the highlighted option and keep the menu open; Backspace (menu closed) removes the last chip; each chip\'s × is focusable and removes that value.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'multi-select-field', label: 'Default fill', token: '--helix-select-fill-default', kind: 'color' },
    { part: 'multi-select-field', label: 'Default border', token: '--helix-select-border-default', kind: 'color' },
    { part: 'multi-select-field', label: 'Default border', token: '--helix-select-border-hover', kind: 'color', state: 'hover' },
    { part: 'multi-select-field', label: 'Focus border', token: '--helix-select-border-focus', kind: 'color' },
    { part: 'multi-select-field', label: 'Invalid border', token: '--helix-select-border-invalid', kind: 'color' },
    { part: 'multi-select-field', label: 'Disabled fill', token: '--helix-select-fill-disabled', kind: 'color', state: 'disabled' },
    { part: 'multi-select-field', label: 'Disabled border', token: '--helix-select-border-disabled', kind: 'color', state: 'disabled' },
    { part: 'multi-select-placeholder', label: 'Placeholder text', token: '--helix-select-text-placeholder', kind: 'color' },
    { part: 'multi-select-field', label: 'gap (chips)', token: '--helix-spacing-2xs', kind: 'space', axis: 'horizontal', meta: '4px between chips' },
    { part: 'multi-select-field', label: 'gap (rows)', token: '--helix-spacing-3xs', kind: 'space', axis: 'vertical', meta: '2px between wrapped rows' },
    { part: 'multi-select-root', label: 'gap', token: '--helix-select-gap', kind: 'space', axis: 'vertical', meta: '8px, label↔field and field↔description/error — form-field-spacing pattern' },
  ],
  features: [
    'Select\'s field — same tokens, 32px minimum height, chevron, label/description/error and form participation',
    'Selected values as dismissible Chips (size s, 28px) inside the field, 2px from its outer edge; the field grows downward when they wrap',
    'Menu in multiple mode — picking an option toggles it without closing the menu',
    'Backspace removes the last chip; each chip\'s × removes its value',
  ],
  examples: [
    { label: 'Default', code: `<MultiSelect label="Skills" options={options} placeholder="Choose skills…" />` },
    { label: 'Controlled', code: `<MultiSelect label="Skills" options={options} value={skills} onChange={setSkills} />` },
    { label: 'Invalid', code: `<MultiSelect label="Skills" options={options} invalid errorMessage="Pick at least one" />` },
  ],
};
