/** Machine-readable component documentation for the Helix Input. */

export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: { part: string; label: string; token?: string; value?: string; kind?: 'color' | 'typography' | 'space' | 'radius' | 'shadow' | 'style' | 'other'; meta?: string }[];
  features: string[];
  examples: { label: string; code: string }[];
}

export const doc: ComponentDoc = {
  name: 'Input',
  purpose: 'Allows users to enter a single line of free-form text.',
  contract: 'contracts/components/Input.json',
  a11y: [
    'The `label` prop is required. Use `hideLabel` only when a visible label would be redundant.',
    'Pair `invalid` with `errorMessage` so screen readers get a clear validation message.',
  ],
  variants: [],
  sizes: ['s', 'm', 'l'],
  tokens: [
    { part: 'input-wrapper', label: 'Default fill', token: '--helix-input-fill-default', kind: 'color' },
    { part: 'input-wrapper', label: 'Default border', token: '--helix-input-border-default', kind: 'color' },
    { part: 'input-wrapper', label: 'Focus border', token: '--helix-input-border-focus', kind: 'color' },
    { part: 'input-field', label: 'Value text', token: '--helix-input-text-value', kind: 'color' },
    { part: 'input-field', label: 'Placeholder text', token: '--helix-input-text-placeholder', kind: 'color' },
    { part: 'input-label', label: 'label', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Label' },
    { part: 'input-label', label: 'label.weight', token: '--helix-primitive-fontWeight-medium', kind: 'typography', meta: 'Medium' },
    { part: 'input-description', label: 'description', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'input-error', label: 'error', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'input-field', label: 'field.height', token: '--helix-input-height-s', kind: 'space' },
    { part: 'input-field', label: 'field.height', token: '--helix-input-height-m', kind: 'space' },
    { part: 'input-field', label: 'field.height', token: '--helix-input-height-l', kind: 'space' },
    { part: 'input-root', label: 'gap.label.field', token: '--helix-input-gap-label', kind: 'space' },
    { part: 'input-root', label: 'gap.description.field', token: '--helix-input-gap-description', kind: 'space' },
    { part: 'input-wrapper', label: 'input.root', token: '--helix-input-radius', kind: 'radius' },
    { part: 'input-root', label: 'display', value: 'flex' },
    { part: 'input-root', label: 'flex-direction', value: 'column' },
    { part: 'input-root', label: 'width', value: 'fit-content' },
    { part: 'input-wrapper', label: 'position', value: 'relative' },
    { part: 'input-wrapper', label: 'align-items', value: 'center' },
    { part: 'input-field', label: 'background', value: 'transparent' },
    { part: 'input-field', label: 'border', value: 'none' },
    { part: 'input-field', label: 'outline', value: 'none' },
    { part: 'input-field', label: 'font-family', value: 'inherit' },
    { part: 'input-field', label: 'min-width', value: '0' },
    { part: 'input-field', label: 'flex', value: '1' },
    { part: 'input-field', label: 'cursor.disabled', value: 'not-allowed' },
    { part: 'input-icon', label: 'display.icon', value: 'flex' },
    { part: 'input-icon', label: 'height.icon', value: '100%' },
  ],
  features: [
    'label / hideLabel — accessible label support',
    'size — shared field scale: s=32px, m=36px, l=40px',
    'invalid / errorMessage — validation state and helper copy',
    'icon / iconEnd — leading and trailing adornments',
    'loading — async validation state',
    'fullWidth — expands to container width',
  ],
  examples: [
    { label: 'Default', code: `<Input label="Email" placeholder="you@example.com" />` },
    { label: 'With helper text', code: `<Input label="Username" description="Used for your public profile" />` },
    { label: 'Invalid', code: `<Input label="Email" invalid errorMessage="Enter a valid email address" />` },
  ],
};
