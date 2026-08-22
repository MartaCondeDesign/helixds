/** Machine-readable component documentation for the Helix Select. */

export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: { part: string; label: string; token?: string; value?: string; kind?: 'color' | 'typography' | 'space' | 'radius' | 'shadow' | 'style' | 'other'; variant?: string; size?: string; state?: 'hover' | 'press' | 'disabled' | 'focus'; axis?: 'horizontal' | 'vertical'; meta?: string }[];
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
    { part: 'select-trigger', label: 'Default fill', token: '--helix-select-fill-default', kind: 'color' },
    { part: 'select-trigger', label: 'Default border', token: '--helix-select-border-default', kind: 'color' },
    { part: 'select-trigger', label: 'Default border', token: '--helix-select-border-hover', kind: 'color', state: 'hover' },
    { part: 'select-trigger', label: 'Focus border', token: '--helix-select-border-focus', kind: 'color' },
    { part: 'select-trigger', label: 'Disabled fill', token: '--helix-select-fill-disabled', kind: 'color', state: 'disabled' },
    { part: 'select-trigger', label: 'Disabled border', token: '--helix-select-border-disabled', kind: 'color', state: 'disabled' },
    { part: 'select-trigger', label: 'Disabled text', token: '--helix-select-text-disabled', kind: 'color', state: 'disabled' },
    { part: 'select-trigger', label: 'Value text', token: '--helix-select-text-value', kind: 'color' },
    { part: 'select-trigger', label: 'Placeholder text', token: '--helix-select-text-placeholder', kind: 'color' },
    { part: 'select-root', label: 'gap.label.field', token: '--helix-primitive-spacing-25', kind: 'space', axis: 'vertical' },
    { part: 'select-label', label: 'label', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Label' },
    { part: 'select-label', label: 'label.weight', token: '--helix-primitive-fontWeight-medium', kind: 'typography', meta: 'Medium' },
    { part: 'select-trigger', label: 'value', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall', size: 's' },
    { part: 'select-trigger', label: 'value', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Body small', size: 'm' },
    { part: 'select-trigger', label: 'value', token: '--helix-primitive-fontSize-m', kind: 'typography', meta: 'Body base', size: 'l' },
    { part: 'select-description', label: 'description', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'select-error', label: 'error', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'select-trigger', label: 'padding.top', value: '0', kind: 'space', axis: 'vertical' },
    { part: 'select-trigger', label: 'padding.bottom', value: '0', kind: 'space', axis: 'vertical' },
    { part: 'select-trigger', label: 'padding.start', token: '--helix-primitive-spacing-50', kind: 'space', axis: 'horizontal', size: 's', meta: 'Smaller than end — no chevron on the left' },
    { part: 'select-trigger', label: 'padding.end', token: '--helix-primitive-spacing-200', kind: 'space', axis: 'horizontal', size: 's', meta: 'Larger than start — reserves room for the chevron' },
    { part: 'select-trigger', label: 'padding.start', token: '--helix-primitive-spacing-75', kind: 'space', axis: 'horizontal', size: 'm', meta: 'Smaller than end — no chevron on the left' },
    { part: 'select-trigger', label: 'padding.end', token: '--helix-primitive-spacing-250', kind: 'space', axis: 'horizontal', size: 'm', meta: 'Larger than start — reserves room for the chevron' },
    { part: 'select-trigger', label: 'padding.start', token: '--helix-primitive-spacing-100', kind: 'space', axis: 'horizontal', size: 'l', meta: 'Smaller than end — no chevron on the left' },
    { part: 'select-trigger', label: 'padding.end', token: '--helix-primitive-spacing-250', kind: 'space', axis: 'horizontal', size: 'l', meta: 'Larger than start — reserves room for the chevron' },
    { part: 'select-trigger', label: 'field.height', token: '--helix-select-height-s', kind: 'space', size: 's' },
    { part: 'select-trigger', label: 'field.height', token: '--helix-select-height-m', kind: 'space', size: 'm' },
    { part: 'select-trigger', label: 'field.height', token: '--helix-select-height-l', kind: 'space', size: 'l' },
    { part: 'select-trigger', label: 'select.root', token: '--helix-select-radius', kind: 'radius' },
    { part: 'select-root', label: 'display', value: 'flex' },
    { part: 'select-root', label: 'flex-direction', value: 'column' },
    { part: 'select-root', label: 'width', value: 'fit-content' },
    { part: 'select-wrapper', label: 'position.wrapper', value: 'relative' },
    { part: 'select-wrapper', label: 'display.wrapper', value: 'flex' },
    { part: 'select-trigger', label: 'appearance', value: 'none' },
    { part: 'select-trigger', label: '-webkit-appearance', value: 'none' },
    { part: 'select-trigger', label: 'cursor', value: 'pointer' },
    { part: 'select-trigger', label: 'outline', value: 'none' },
    { part: 'select-trigger', label: 'cursor.disabled', value: 'not-allowed' },
    { part: 'select-chevron', label: 'pointer-events', value: 'none' },
    { part: 'select-chevron', label: 'display.chevron', value: 'flex' },
    { part: 'select-chevron', label: 'position.chevron', value: 'absolute' },
    { part: 'select-chevron', label: 'top.chevron', value: '50%' },
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
