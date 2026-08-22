/** Machine-readable component documentation for the Helix Textarea. */

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
  name: 'Textarea',
  purpose: 'Lets users enter multi-line free-form text.',
  contract: 'contracts/components/Textarea.json',
  a11y: [
    'The `label` prop is required. Use `hideLabel` only when a visible label would be redundant.',
    'Pair `invalid` with `errorMessage` and keep the counter meaningful when `showCount` is enabled.',
  ],
  variants: [],
  sizes: ['s', 'm', 'l'],
  tokens: [
    { part: 'textarea', label: 'Default fill', token: '--helix-textarea-fill-default', kind: 'color' },
    { part: 'textarea', label: 'Default border', token: '--helix-textarea-border-default', kind: 'color' },
    { part: 'textarea', label: 'Focus border', token: '--helix-textarea-border-focus', kind: 'color' },
    { part: 'textarea', label: 'Value text', token: '--helix-textarea-text-value', kind: 'color' },
    { part: 'textarea', label: 'Placeholder text', token: '--helix-textarea-text-placeholder', kind: 'color' },
    { part: 'textarea', label: 'label', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Label' },
    { part: 'textarea', label: 'label.weight', token: '--helix-primitive-fontWeight-medium', kind: 'typography', meta: 'Medium' },
    { part: 'textarea', label: 'description', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'textarea', label: 'error', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'textarea', label: 'gap.label.field', token: '--helix-primitive-spacing-25', kind: 'space' },
    { part: 'textarea', label: 'textarea.root', token: '--helix-textarea-radius', kind: 'radius' },
    { part: 'textarea', label: 'display', value: 'flex' },
    { part: 'textarea', label: 'flex-direction', value: 'column' },
    { part: 'textarea', label: 'width', value: 'fit-content' },
    { part: 'textarea', label: 'background', value: 'transparent' },
    { part: 'textarea', label: 'border', value: 'none' },
    { part: 'textarea', label: 'outline', value: 'none' },
    { part: 'textarea', label: 'font-family', value: 'inherit' },
    { part: 'textarea', label: 'resize', value: 'vertical' },
    { part: 'textarea', label: 'resize.none', value: 'none' },
    { part: 'textarea', label: 'resize.horizontal', value: 'horizontal' },
    { part: 'textarea', label: 'resize.both', value: 'both' },
    { part: 'textarea', label: 'cursor.disabled', value: 'not-allowed' },
  ],
  features: [
    'label / hideLabel — accessible label support',
    'size — shared field scale: s=32px, m=36px, l=40px',
    'rows — controls visible height',
    'showCount + maxLength — live character counter',
    'resize — native resize behavior',
  ],
  examples: [
    { label: 'Default', code: `<Textarea label="Notes" />` },
    { label: 'With counter', code: `<Textarea label="Bio" maxLength={160} showCount />` },
    { label: 'Invalid', code: `<Textarea label="Feedback" invalid errorMessage="Please add more detail" />` },
  ],
};
