/** Machine-readable component documentation for the Helix Checkbox. */

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
  name: 'Checkbox',
  purpose: 'Lets users toggle a single independent boolean option on or off.',
  contract: 'contracts/components/Checkbox.json',
  a11y: [
    'The `label` prop is required and renders inside a real `<label>` bound to the native checkbox input.',
    'Pair `invalid` with `errorMessage` so screen readers get a clear validation message.',
    '`indeterminate` sets the native `indeterminate` DOM property — it is a visual/AX state only, not a value.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'checkbox-control', label: 'Default fill', token: '--helix-checkbox-fill-default', kind: 'color' },
    { part: 'checkbox-control', label: 'Checked fill', token: '--helix-checkbox-fill-checked', kind: 'color' },
    { part: 'checkbox-control', label: 'Default border', token: '--helix-checkbox-border-default', kind: 'color' },
    { part: 'checkbox-control', label: 'Checked border', token: '--helix-checkbox-border-checked', kind: 'color' },
    { part: 'checkbox-control', label: 'Focus border', token: '--helix-checkbox-border-focus', kind: 'color' },
    { part: 'checkbox-control', label: 'Invalid border', token: '--helix-checkbox-border-invalid', kind: 'color' },
    { part: 'checkbox-indicator', label: 'Check icon color', token: '--helix-checkbox-icon-color', kind: 'color' },
    { part: 'checkbox-text', label: 'Label text', token: '--helix-checkbox-text-label', kind: 'color' },
    { part: 'checkbox-description', label: 'Description text', token: '--helix-checkbox-text-description', kind: 'color' },
    { part: 'checkbox-error', label: 'Error text', token: '--helix-checkbox-text-error', kind: 'color' },
    { part: 'checkbox-control', label: 'control.size', token: '--helix-checkbox-size', kind: 'space' },
    { part: 'checkbox-description', label: 'gap.control.description', token: '--helix-primitive-spacing-50', kind: 'space' },
    { part: 'checkbox-control', label: 'checkbox.control', token: '--helix-checkbox-radius', kind: 'radius' },
    { part: 'checkbox-root', label: 'display', value: 'block' },
    { part: 'checkbox-label', label: 'display', value: 'flex' },
    { part: 'checkbox-label', label: 'align-items', value: 'flex-start' },
    { part: 'checkbox-label', label: 'cursor', value: 'pointer' },
    { part: 'checkbox-input', label: 'position', value: 'absolute' },
    { part: 'checkbox-input', label: 'opacity', value: '0' },
    { part: 'checkbox-control', label: 'display', value: 'inline-flex' },
    { part: 'checkbox-control', label: 'align-items', value: 'center' },
    { part: 'checkbox-control', label: 'justify-content', value: 'center' },
    { part: 'checkbox-control', label: 'flex-shrink', value: '0' },
  ],
  features: [
    'label — required accessible label, rendered next to the control',
    'description / errorMessage — helper copy and validation message',
    'indeterminate — visual "partial selection" state for parent/group checkboxes',
    'checked / defaultChecked — controlled or uncontrolled boolean state',
    'invalid — validation state, pairs with errorMessage',
  ],
  examples: [
    { label: 'Default', code: `<Checkbox label="Accept terms" />` },
    { label: 'With description', code: `<Checkbox label="Marketing emails" description="Occasional product updates" />` },
    { label: 'Indeterminate', code: `<Checkbox label="Select all" indeterminate />` },
    { label: 'Invalid', code: `<Checkbox label="Accept terms" invalid errorMessage="You must accept the terms" />` },
  ],
};
