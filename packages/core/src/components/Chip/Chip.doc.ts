/** Machine-readable component documentation for the Helix Chip. */

export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: { part: string; label: string; token?: string; value?: string; kind?: 'color' | 'typography' | 'space' | 'radius' | 'shadow' | 'style' | 'other'; variant?: string; meta?: string }[];
  features: string[];
  examples: { label: string; code: string }[];
}

export const doc: ComponentDoc = {
  name: 'Chip',
  purpose: 'Represents a compact selectable label for filters, categories, or short choices.',
  contract: 'contracts/components/Chip.json',
  a11y: [
    'Use `onPress` for selection and `onDismiss` for removal; they are separate actions.',
    'Keep the label concise and descriptive. The dismiss control must remain reachable with the keyboard.',
  ],

  variants: [
    { name: 'neutral', description: 'Default neutral chip for generic filters and tags.' },
    { name: 'info', description: 'Blue semantic chip for informational categories.' },
    { name: 'success', description: 'Green semantic chip for positive or active states.' },
    { name: 'warning', description: 'Orange semantic chip for caution or pending states.' },
    { name: 'danger', description: 'Red semantic chip for destructive or error-related states.' },
  ],

  sizes: ['s', 'm'],

  tokens: [
    { part: 'chip', label: 'fill.surface', token: '--helix-color-fill-surface', kind: 'color', variant: 'neutral' },
    { part: 'chip', label: 'fill.secondary', token: '--helix-color-fill-secondary', kind: 'color', variant: 'neutral' },
    { part: 'chip', label: 'fill.info', token: '--helix-color-fill-info', kind: 'color', variant: 'info' },
    { part: 'chip', label: 'fill.success', token: '--helix-color-fill-success', kind: 'color', variant: 'success' },
    { part: 'chip', label: 'fill.warning', token: '--helix-color-fill-warning', kind: 'color', variant: 'warning' },
    { part: 'chip', label: 'fill.danger', token: '--helix-color-fill-danger', kind: 'color', variant: 'danger' },
    { part: 'chip', label: 'chip.root', token: '--helix-chip-radius', kind: 'radius' },
    { part: 'chip', label: 'gap.icon.text', token: '--helix-chip-gap-m', kind: 'space' },
    { part: 'chip', label: 'label.s', token: '--helix-chip-fontSize-s', kind: 'typography', meta: 'Body small' },
    { part: 'chip', label: 'label.m', token: '--helix-chip-fontSize-m', kind: 'typography', meta: 'Body small' },
    { part: 'chip', label: 'weight', token: '--helix-chip-fontWeight', kind: 'typography', meta: 'Medium' },
    { part: 'chip', label: 'display', value: 'inline-flex' },
    { part: 'chip', label: 'align-items', value: 'center' },
    { part: 'chip', label: 'justify-content', value: 'center' },
    { part: 'chip', label: 'box-sizing', value: 'border-box' },
    { part: 'chip', label: 'line-height', value: '1' },
    { part: 'chip', label: 'white-space', value: 'nowrap' },
    { part: 'chip', label: 'user-select', value: 'none' },
    { part: 'chip', label: 'text-decoration', value: 'none' },
    { part: 'chip', label: 'outline', value: 'none' },
    { part: 'chip', label: '-webkit-appearance', value: 'none' },
    { part: 'chip', label: 'appearance', value: 'none' },
    { part: 'chip', label: 'cursor', value: 'pointer' },
    { part: 'chip', label: 'cursor.disabled', value: 'not-allowed' },
    { part: 'chip', label: 'opacity.disabled', value: '0.72' },
    { part: 'chip', label: 'pointer-events', value: 'none' },
  ],

  features: [
    'forwardRef — accepts a ref to the underlying <button> element',
    'size — horizontal density preset (documented exception to the global scale)',
    'checked — communicates active state with aria-pressed',
    'dismissible — optional close button for removable chips',
    'icon / iconEnd — optional icon slots with aria-hidden',
    'onPress — canonical handler',
    'onDismiss — close button handler',
    'disabled — native button disabled state',
  ],

  examples: [
    {
      label: 'Neutral',
      code: `<Chip label="All" />`,
    },
    {
      label: 'Selected',
      code: `<Chip label="Open" checked />`,
    },
    {
      label: 'With icon',
      code: `<Chip label="Filters" icon={<IconFilter size={14} stroke={1.5} />} />`,
    },
    {
      label: 'Dismissible',
      code: `<Chip label="Recent" dismissible onDismiss={() => {}} />`,
    },
    {
      label: 'Success',
      code: `<Chip variant="success" label="Approved" />`,
    },
  ],
};
