/** Machine-readable component documentation for the Helix Button. */

export interface ComponentDoc {
  name:     string;
  purpose:  string;
  contract: string;
  a11y:     string[];
  variants: { name: string; description: string }[];
  sizes:    string[];
  tokens:   { part: string; token: string; kind?: 'color' | 'typography' | 'space' | 'style'; variant?: string; meta?: string }[];
  features: string[];
  examples: { label: string; code: string }[];
}

export const doc: ComponentDoc = {
  name:     'Button',
  purpose:  'Triggers an action or navigates to a destination when pressed.',
  contract: 'contracts/components/Button.json',
  a11y: [
    'Use `onPress` for actions. For navigation, use a real `<a>` styled separately — Button always renders a `<button>`.',
    'Keep the label descriptive; icon-only buttons need an accessible name.',
  ],

  variants: [
    { name: 'primary',   description: 'Filled brand background. Use for the main CTA in a view.' },
    { name: 'secondary', description: 'Outlined, neutral. Use for secondary actions alongside a primary.' },
    { name: 'ghost',     description: 'No background or border. Use inside toolbars and dense UI.' },
    { name: 'danger',    description: 'Filled red. Use only for irreversible destructive actions.' },
  ],

  sizes: ['xs', 's', 'm', 'l', 'xl'],

  tokens: [
    { part: 'button', label: 'fill.primary', token: '--helix-button-fill-primary-default', kind: 'color', variant: 'primary' },
    { part: 'button', label: 'fill.secondary', token: '--helix-button-fill-secondary-default', kind: 'color', variant: 'secondary' },
    { part: 'button', label: 'fill.danger', token: '--helix-button-fill-danger-default', kind: 'color', variant: 'danger' },
    { part: 'button', label: 'border.focus', token: '--helix-button-border-focus', kind: 'color' },
    { part: 'button', label: 'button.root', token: '--helix-button-radius', kind: 'radius' },
    { part: 'button', label: 'gap.icon.text', token: '--helix-primitive-spacing-2', kind: 'space' },
    { part: 'button', label: 'label.xs', token: '--helix-button-fontSize-xs', kind: 'typography', meta: 'Caption / label' },
    { part: 'button', label: 'label.s', token: '--helix-button-fontSize-s', kind: 'typography', meta: 'Body small' },
    { part: 'button', label: 'label.m', token: '--helix-button-fontSize-m', kind: 'typography', meta: 'Body small' },
    { part: 'button', label: 'label.l', token: '--helix-button-fontSize-l', kind: 'typography', meta: 'Body base' },
    { part: 'button', label: 'label.xl', token: '--helix-button-fontSize-xl', kind: 'typography', meta: 'Body large' },
    { part: 'button', label: 'display', value: 'inline-flex' },
    { part: 'button', label: 'align-items', value: 'center' },
    { part: 'button', label: 'justify-content', value: 'center' },
    { part: 'button', label: 'font-family', value: 'inherit' },
    { part: 'button', label: 'border', value: '1px solid transparent' },
    { part: 'button', label: 'cursor', value: 'pointer' },
    { part: 'button', label: 'white-space', value: 'nowrap' },
    { part: 'button', label: 'user-select', value: 'none' },
    { part: 'button', label: 'text-decoration', value: 'none' },
    { part: 'button', label: 'outline', value: 'none' },
    { part: 'button', label: 'flex-shrink', value: '0' },
    { part: 'button', label: 'position', value: 'relative' },
    { part: 'button', label: '-webkit-appearance', value: 'none' },
    { part: 'button', label: 'background-color', value: 'transparent' },
    { part: 'button', label: 'border-color', value: 'transparent' },
    { part: 'button', label: 'opacity', value: '0.5' },
    { part: 'button', label: 'cursor.disabled', value: 'not-allowed' },
    { part: 'button', label: 'pointer-events', value: 'none' },
  ],

  features: [
    'forwardRef — accepts a ref to the underlying <button> element',
    'size — shared control scale: xs=24px, s=32px, m=36px, l=40px, xl=48px',
    'loading — shows spinner, disables interaction, sets aria-busy',
    'icon / iconEnd — Tabler icon slots with aria-hidden',
    'fullWidth — stretches to container width',
    'onPress — canonical handler (wraps onClick)',
  ],

  examples: [
    {
      label: 'Primary',
      code: `<Button>Save changes</Button>`,
    },
    {
      label: 'With leading icon',
      code: `<Button icon={<IconPlus size={16} stroke={1.5} />}>New item</Button>`,
    },
    {
      label: 'With trailing icon',
      code: `<Button iconEnd={<IconArrowRight size={16} stroke={1.5} />}>Continue</Button>`,
    },
    {
      label: 'Loading state',
      code: `<Button loading>Saving…</Button>`,
    },
    {
      label: 'Danger',
      code: `<Button variant="danger">Delete account</Button>`,
    },
  ],
};
