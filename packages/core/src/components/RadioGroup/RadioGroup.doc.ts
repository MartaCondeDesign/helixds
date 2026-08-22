/** Machine-readable component documentation for the Helix RadioGroup. */

export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: { part: string; label: string; token?: string; value?: string; kind?: 'color' | 'typography' | 'space' | 'radius' | 'shadow' | 'style' | 'other'; variant?: string; size?: string; state?: 'hover' | 'press' | 'disabled' | 'focus'; meta?: string }[];
  features: string[];
  examples: { label: string; code: string }[];
}

export const doc: ComponentDoc = {
  name: 'RadioGroup',
  purpose: 'Lets users pick exactly one option from a small, visible set of mutually exclusive choices.',
  contract: 'contracts/components/RadioGroup.json',
  a11y: [
    'Renders a real `<fieldset>`/`<legend>` — the group `label` is the legend, not a per-option label.',
    'Pair `invalid` with `errorMessage` so screen readers get a clear validation message.',
    'Each option is a real `<input type="radio">` sharing one `name`, so arrow-key navigation works natively.',
  ],
  variants: [
    { name: 'vertical', description: 'Default orientation — options stack top to bottom.' },
    { name: 'horizontal', description: 'Options lay out left to right. Use for short option sets only.' },
  ],
  sizes: [],
  tokens: [
    { part: 'radio-control', label: 'Default fill', token: '--helix-radio-fill-default', kind: 'color' },
    { part: 'radio-control', label: 'Checked fill', token: '--helix-radio-fill-checked', kind: 'color' },
    { part: 'radio-control', label: 'Checked fill', token: '--helix-radio-fill-checked-hover', kind: 'color', state: 'hover', meta: 'Hover while checked' },
    { part: 'radio-control', label: 'Default border', token: '--helix-radio-border-default', kind: 'color' },
    { part: 'radio-control', label: 'Default border', token: '--helix-radio-border-hover', kind: 'color', state: 'hover', meta: 'Hover while unchecked' },
    { part: 'radio-control', label: 'Checked border', token: '--helix-radio-border-checked', kind: 'color' },
    { part: 'radio-control', label: 'Focus border', token: '--helix-radio-border-focus', kind: 'color' },
    { part: 'radio-control', label: 'Invalid border', token: '--helix-radio-border-invalid', kind: 'color' },
    { part: 'radio-dot', label: 'Selected dot color', token: '--helix-radio-dot', kind: 'color' },
    { part: 'radio-legend', label: 'Group label text', token: '--helix-radio-text-label', kind: 'color' },
    { part: 'radio-item-label', label: 'Option label text', token: '--helix-radio-text-label', kind: 'color' },
    { part: 'radio-item-description', label: 'Option description text', token: '--helix-radio-text-description', kind: 'color' },
    { part: 'radio-error', label: 'Error text', token: '--helix-radio-text-error', kind: 'color' },
    { part: 'radio-legend', label: 'legend', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Label' },
    { part: 'radio-legend', label: 'legend.weight', token: '--helix-primitive-fontWeight-medium', kind: 'typography', meta: 'Medium' },
    { part: 'radio-item-label', label: 'item.label', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Body small' },
    { part: 'radio-item-label', label: 'item.label.weight', token: '--helix-primitive-fontWeight-medium', kind: 'typography', meta: 'Medium' },
    { part: 'radio-item-description', label: 'item.description', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'radio-control', label: 'control.size', token: '--helix-radio-size', kind: 'space' },
    { part: 'radio-options', label: 'gap.options', token: '--helix-primitive-spacing-75', kind: 'space' },
    { part: 'radio-item', label: 'gap.control.content', token: '--helix-primitive-spacing-50', kind: 'space' },
    { part: 'radio-item-content', label: 'gap.label.description', token: '--helix-primitive-spacing-25', kind: 'space' },
    { part: 'radio-legend', label: 'gap.legend.options', token: '--helix-primitive-spacing-25', kind: 'space' },
    { part: 'radio-control', label: 'radio.control', value: '9999px', kind: 'radius', meta: 'Always a full circle — no semantic.radius token, radios are round by definition' },
    { part: 'radio-group', label: 'display', value: 'block' },
    { part: 'radio-options', label: 'display', value: 'flex' },
    { part: 'radio-options', label: 'flex-direction', value: 'column' },
    { part: 'radio-item', label: 'display', value: 'flex' },
    { part: 'radio-item', label: 'align-items', value: 'flex-start' },
    { part: 'radio-item', label: 'cursor', value: 'pointer' },
    { part: 'radio-input', label: 'position', value: 'absolute' },
    { part: 'radio-input', label: 'opacity', value: '0' },
    { part: 'radio-control', label: 'display', value: 'inline-flex' },
    { part: 'radio-control', label: 'align-items', value: 'center' },
    { part: 'radio-control', label: 'justify-content', value: 'center' },
    { part: 'radio-control', label: 'flex-shrink', value: '0' },
  ],
  features: [
    'label — required legend for the whole group',
    'options — array of { value, label, description?, disabled? }',
    'orientation — vertical (default) or horizontal layout',
    'value / defaultValue — controlled or uncontrolled selection',
    'invalid / errorMessage — group-level validation state and helper copy',
    'disabled — disables the whole group; individual options can also disable themselves',
  ],
  examples: [
    {
      label: 'Default',
      code: `<RadioGroup label="Plan" options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]} />`,
    },
    {
      label: 'With descriptions',
      code: `<RadioGroup label="Plan" options={[{ value: 'free', label: 'Free', description: 'Basic features' }, { value: 'pro', label: 'Pro', description: 'Everything, unlimited' }]} />`,
    },
    {
      label: 'Horizontal',
      code: `<RadioGroup label="Size" orientation="horizontal" options={[{ value: 's', label: 'S' }, { value: 'm', label: 'M' }, { value: 'l', label: 'L' }]} />`,
    },
    {
      label: 'Invalid',
      code: `<RadioGroup label="Plan" options={options} invalid errorMessage="Choose a plan to continue" />`,
    },
  ],
};
