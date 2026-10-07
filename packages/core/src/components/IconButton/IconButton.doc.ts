/** Machine-readable component documentation for the Helix IconButton. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name:     'IconButton',
  purpose:  'Triggers an action via a single icon, with no visible text label — a toolbar action, a row action, a close/dismiss control.',
  contract: 'contracts/components/IconButton.json',
  a11y: [
    '`label` is required — it is the only accessible name the button has, rendered as aria-label.',
    'Only use an icon universally recognizable on its own (trash, close, more/···, edit pencil). If the icon needs a tooltip to be understood, use Button with a visible text label instead.',
  ],

  variants: [
    { name: 'primary',   description: 'Filled brand background. Rare for an icon-only control — most icon actions are secondary.' },
    { name: 'secondary', description: 'Outlined, neutral.' },
    { name: 'ghost',     description: 'No background or border. Default — the common case for toolbar/row-action icons.' },
    { name: 'danger',    description: 'Filled red. Use only for irreversible destructive actions (e.g. delete).' },
  ],

  sizes: ['s', 'm', 'l'],

  tokens: [
    { part: 'icon-button', label: 'fill.primary', token: '--helix-iconButton-fill-primary-default', kind: 'color', variant: 'primary' },
    { part: 'icon-button', label: 'fill.primary', token: '--helix-iconButton-fill-primary-hover', kind: 'color', variant: 'primary', state: 'hover' },
    { part: 'icon-button', label: 'fill.primary', token: '--helix-iconButton-fill-primary-press', kind: 'color', variant: 'primary', state: 'press' },
    { part: 'icon-button', label: 'fill.secondary', token: '--helix-iconButton-fill-secondary-default', kind: 'color', variant: 'secondary' },
    { part: 'icon-button', label: 'fill.secondary', token: '--helix-iconButton-fill-secondary-hover', kind: 'color', variant: 'secondary', state: 'hover' },
    { part: 'icon-button', label: 'fill.secondary', token: '--helix-iconButton-fill-secondary-press', kind: 'color', variant: 'secondary', state: 'press' },
    { part: 'icon-button', label: 'border.secondary', token: '--helix-iconButton-border-secondary-default', kind: 'color', variant: 'secondary' },
    { part: 'icon-button', label: 'border.secondary', token: '--helix-iconButton-border-secondary-hover', kind: 'color', variant: 'secondary', state: 'hover' },
    { part: 'icon-button', label: 'fill.ghost', token: '--helix-iconButton-fill-secondary-default', kind: 'color', variant: 'ghost', state: 'hover' },
    { part: 'icon-button', label: 'fill.ghost', token: '--helix-iconButton-fill-secondary-hover', kind: 'color', variant: 'ghost', state: 'press' },
    { part: 'icon-button', label: 'fill.danger', token: '--helix-iconButton-fill-danger-default', kind: 'color', variant: 'danger' },
    { part: 'icon-button', label: 'fill.danger', token: '--helix-iconButton-fill-danger-hover', kind: 'color', variant: 'danger', state: 'hover' },
    { part: 'icon-button', label: 'fill.danger', token: '--helix-iconButton-fill-danger-press', kind: 'color', variant: 'danger', state: 'press' },
    { part: 'icon-button', label: 'border.focus', token: '--helix-iconButton-border-focus', kind: 'color' },
    { part: 'icon-button', label: 'icon-button.root', token: '--helix-iconButton-radius', kind: 'radius' },
    { part: 'icon-button', label: 'size.s', token: '--helix-iconButton-height-s', kind: 'space', size: 's', meta: 'width = height (square)' },
    { part: 'icon-button', label: 'size.m', token: '--helix-iconButton-height-m', kind: 'space', size: 'm', meta: 'width = height (square)' },
    { part: 'icon-button', label: 'size.l', token: '--helix-iconButton-height-l', kind: 'space', size: 'l', meta: 'width = height (square)' },
    { part: 'icon-button', label: 'display', value: 'inline-flex' },
    { part: 'icon-button', label: 'align-items', value: 'center' },
    { part: 'icon-button', label: 'justify-content', value: 'center' },
    { part: 'icon-button', label: 'border', value: '1px solid transparent' },
    { part: 'icon-button', label: 'cursor', value: 'pointer' },
    { part: 'icon-button', label: 'outline', value: 'none' },
    { part: 'icon-button', label: 'flex-shrink', value: '0' },
    { part: 'icon-button', label: 'padding', value: '0' },
    { part: 'icon-button', label: '-webkit-appearance', value: 'none' },
    { part: 'icon-button', label: 'background-color', value: 'transparent' },
    { part: 'icon-button', label: 'border-color', value: 'transparent' },
    { part: 'icon-button', label: 'opacity', value: '0.5', state: 'disabled' },
    { part: 'icon-button', label: 'cursor.disabled', value: 'not-allowed', state: 'disabled' },
    { part: 'icon-button', label: 'pointer-events', value: 'none', state: 'disabled' },
  ],

  features: [
    'forwardRef — accepts a ref to the underlying <button> element',
    "size — same height tokens/scale as Button: s=24px, m=32px (default), l=40px; width always equals height",
    'isLoading — shows spinner in place of the icon, disables interaction, sets aria-busy',
    'icon — a single required Tabler icon slot, sized relative to the button (s→16, m→18, l→20)',
    'onClick — canonical handler (React\'s own; onClick is an anti-synonym, ADR-022)',
  ],

  examples: [
    {
      label: 'Default (ghost)',
      code: `<IconButton icon={IconTrash} label="Delete item" />`,
    },
    {
      label: 'Secondary, small',
      code: `<IconButton icon={IconX} label="Dismiss" variant="secondary" size="s" />`,
    },
    {
      label: 'Danger',
      code: `<IconButton icon={IconTrash} label="Delete account" variant="danger" />`,
    },
    {
      label: 'Loading state',
      code: `<IconButton icon={IconRefresh} label="Refresh" isLoading />`,
    },
  ],
};
