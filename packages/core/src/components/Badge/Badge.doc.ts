/** Machine-readable component documentation for the Helix Badge. */

export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: { part: string; token: string; kind?: 'color' | 'typography' | 'space' | 'style'; variant?: string; meta?: string }[];
  features: string[];
  examples: { label: string; code: string }[];
}

export const doc: ComponentDoc = {
  name: 'Badge',
  purpose: 'Communicates status, category labels, or counts in a compact capsule.',
  contract: 'contracts/components/Badge.json',
  a11y: [
    'Keep the label meaningful; never rely on color alone to communicate status.',
    'If an icon is present, treat it as decorative and keep the text readable on its own.',
  ],
  variants: [
    { name: 'neutral', description: 'Default neutral badge for generic labels and counts.' },
    { name: 'info', description: 'Blue semantic badge for informational categories.' },
    { name: 'success', description: 'Green semantic badge for positive or active states.' },
    { name: 'warning', description: 'Orange semantic badge for caution or pending states.' },
    { name: 'danger', description: 'Red semantic badge for destructive or error-related states.' },
  ],
  sizes: ['xs', 's'],
  tokens: [
    { part: 'badge', label: 'fill.neutral', token: '--helix-badge-fill-neutral', kind: 'color', variant: 'neutral' },
    { part: 'badge', label: 'fill.info', token: '--helix-badge-fill-info', kind: 'color', variant: 'info' },
    { part: 'badge', label: 'fill.success', token: '--helix-badge-fill-success', kind: 'color', variant: 'success' },
    { part: 'badge', label: 'fill.warning', token: '--helix-badge-fill-warning', kind: 'color', variant: 'warning' },
    { part: 'badge', label: 'fill.danger', token: '--helix-badge-fill-danger', kind: 'color', variant: 'danger' },
    { part: 'badge', label: 'text.neutral', token: '--helix-badge-text-neutral', kind: 'color', variant: 'neutral' },
    { part: 'badge', label: 'text.info', token: '--helix-badge-text-info', kind: 'color', variant: 'info' },
    { part: 'badge', label: 'text.success', token: '--helix-badge-text-success', kind: 'color', variant: 'success' },
    { part: 'badge', label: 'text.warning', token: '--helix-badge-text-warning', kind: 'color', variant: 'warning' },
    { part: 'badge', label: 'text.danger', token: '--helix-badge-text-danger', kind: 'color', variant: 'danger' },
    { part: 'badge', label: 'border.neutral', token: '--helix-badge-border-neutral', kind: 'color', variant: 'neutral' },
    { part: 'badge', label: 'border.info', token: '--helix-badge-border-info', kind: 'color', variant: 'info' },
    { part: 'badge', label: 'border.success', token: '--helix-badge-border-success', kind: 'color', variant: 'success' },
    { part: 'badge', label: 'border.warning', token: '--helix-badge-border-warning', kind: 'color', variant: 'warning' },
    { part: 'badge', label: 'border.danger', token: '--helix-badge-border-danger', kind: 'color', variant: 'danger' },
    { part: 'badge', label: 'badge.root', token: '--helix-badge-radius', kind: 'radius' },
    { part: 'badge', label: 'gap.icon.text', token: '--helix-primitive-spacing-25', kind: 'space' },
    { part: 'badge', label: 'label', token: '--helix-badge-fontSize', kind: 'typography', meta: 'Caption / label' },
    { part: 'badge', label: 'weight', token: '--helix-badge-fontWeight', kind: 'typography', meta: 'Semibold' },
    { part: 'badge', label: 'display', value: 'inline-flex' },
    { part: 'badge', label: 'align-items', value: 'center' },
    { part: 'badge', label: 'box-sizing', value: 'border-box' },
    { part: 'badge', label: 'white-space', value: 'nowrap' },
    { part: 'badge', label: 'line-height', value: '1' },
    { part: 'badge', label: 'border', value: '1px solid transparent' },
    { part: 'badge', label: 'padding.xs', value: '2px 6px' },
    { part: 'badge', label: 'padding.s', value: '3px 10px' },
    { part: 'badge', label: 'display.icon', value: 'flex' },
  ],
  features: [
    'size — horizontal density preset (documented exception to the global scale)',
    'icon — optional leading 12px icon',
  ],
  examples: [
    { label: 'Default', code: `<Badge label="Draft" />` },
    { label: 'XS', code: `<Badge size="xs" label="Draft" />` },
    { label: 'With icon', code: `<Badge icon={<IconClock size={12} />} label="Queued" />` },
  ],
};
