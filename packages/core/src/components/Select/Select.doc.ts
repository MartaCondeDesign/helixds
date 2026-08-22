/** Machine-readable component documentation for the Helix Select. */

export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: { part: string; token: string; kind?: 'color' | 'typography' | 'space' | 'radius' | 'style'; meta?: string }[];
  features: string[];
  examples: { label: string; code: string }[];
}

export const doc: ComponentDoc = {
  name: 'Select',
  purpose: 'Lets users choose a single value from a predefined list.',
  contract: 'contracts/components/Select.json',
  a11y: [
    'The `label` prop is required. Use `placeholder` as a prompt, not as the selected value.',
    'Use a real `<option>` list for keyboard and form behavior.',
  ],
  variants: [],
  sizes: ['s', 'm', 'l'],
  tokens: [
    { part: 'select', label: 'Default fill', token: '--helix-select-fill-default', kind: 'color' },
    { part: 'select', label: 'Default border', token: '--helix-select-border-default', kind: 'color' },
    { part: 'select', label: 'Focus border', token: '--helix-select-border-focus', kind: 'color' },
    { part: 'select', label: 'Value text', token: '--helix-select-text-value', kind: 'color' },
    { part: 'select', label: 'Placeholder text', token: '--helix-select-text-placeholder', kind: 'color' },
    { part: 'select', label: 'gap.label.field', token: '--helix-primitive-spacing-25', kind: 'space' },
    { part: 'select', label: 'label', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Label' },
    { part: 'select', label: 'label.weight', token: '--helix-primitive-fontWeight-medium', kind: 'typography', meta: 'Medium' },
    { part: 'select', label: 'value.s', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Body small' },
    { part: 'select', label: 'value.l', token: '--helix-primitive-fontSize-m', kind: 'typography', meta: 'Body base' },
    { part: 'select', label: 'description', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'select', label: 'error', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'select', label: 'select.root', token: '--helix-select-radius', kind: 'radius' },
    { part: 'select', label: 'display', value: 'flex' },
    { part: 'select', label: 'flex-direction', value: 'column' },
    { part: 'select', label: 'width', value: 'fit-content' },
    { part: 'select', label: 'position.wrapper', value: 'relative' },
    { part: 'select', label: 'display.wrapper', value: 'flex' },
    { part: 'select', label: 'appearance', value: 'none' },
    { part: 'select', label: '-webkit-appearance', value: 'none' },
    { part: 'select', label: 'cursor', value: 'pointer' },
    { part: 'select', label: 'outline', value: 'none' },
    { part: 'select', label: 'cursor.disabled', value: 'not-allowed' },
    { part: 'select', label: 'pointer-events', value: 'none' },
    { part: 'select', label: 'display.chevron', value: 'flex' },
    { part: 'select', label: 'position.chevron', value: 'absolute' },
    { part: 'select', label: 'top.chevron', value: '50%' },
  ],
  features: [
    'native select element — keyboard and form behavior out of the box',
    'size — shared field scale: s=32px, m=36px, l=40px',
    'fullWidth — stretches to container width',
    'placeholder option — optional prompt before selection',
    'option groups — supports grouped option sets',
  ],
  examples: [
    { label: 'Default', code: `<Select label="Status" options={options} />` },
    { label: 'With placeholder', code: `<Select label="Country" placeholder="Choose a country" options={options} />` },
    { label: 'Invalid', code: `<Select label="Role" invalid errorMessage="Pick a role" options={options} />` },
  ],
};
