/** Machine-readable component documentation for the Helix Switch. */

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
  name: 'Switch',
  purpose: 'Toggles a single setting on or off immediately, with no separate save step.',
  contract: 'contracts/components/Switch.json',
  a11y: [
    'Renders a real `role="switch"` button plus a visually-hidden native checkbox for form submission.',
    'The `label` prop is required and is bound to the visible control via a real `<label htmlFor>`.',
    'Toggling calls `onChange` immediately — Switch is for instant-effect settings, not for state that needs a separate Save action (use Checkbox for that).',
  ],
  variants: [],
  sizes: ['s', 'm'],
  tokens: [
    { part: 'switch-track', label: 'Off fill', token: '--helix-switch-track-fill-off', kind: 'color' },
    { part: 'switch-track', label: 'On fill', token: '--helix-switch-track-fill-on', kind: 'color' },
    { part: 'switch-track', label: 'On fill', token: '--helix-switch-track-fill-on-hover', kind: 'color', state: 'hover', meta: 'Hover while on — off state has no dedicated hover token' },
    { part: 'switch-track', label: 'Disabled fill', token: '--helix-switch-track-fill-disabled', kind: 'color', state: 'disabled' },
    { part: 'switch-thumb', label: 'Thumb fill', token: '--helix-switch-thumb-fill', kind: 'color' },
    { part: 'switch-track', label: 'Focus outline', token: '--helix-switch-border-focus', kind: 'color' },
    { part: 'switch-label', label: 'Label text', token: '--helix-switch-text-label', kind: 'color' },
    { part: 'switch-description', label: 'Description text', token: '--helix-switch-text-description', kind: 'color' },
    { part: 'switch-label', label: 'label', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Body small' },
    { part: 'switch-description', label: 'description', token: '--helix-primitive-fontSize-xs', kind: 'typography', meta: 'Body xsmall' },
    { part: 'switch-track', label: 'track.width.s', token: '--helix-switch-width-s', kind: 'space' },
    { part: 'switch-track', label: 'track.width.m', token: '--helix-switch-width-m', kind: 'space' },
    { part: 'switch-track', label: 'track.height.s', token: '--helix-switch-height-s', kind: 'space' },
    { part: 'switch-track', label: 'track.height.m', token: '--helix-switch-height-m', kind: 'space' },
    { part: 'switch-thumb', label: 'thumb.size.s', token: '--helix-switch-thumb-size-s', kind: 'space' },
    { part: 'switch-thumb', label: 'thumb.size.m', token: '--helix-switch-thumb-size-m', kind: 'space' },
    { part: 'switch-row', label: 'gap.track.label', token: '--helix-primitive-spacing-75', kind: 'space' },
    { part: 'switch-root', label: 'gap.row.description', token: '--helix-primitive-spacing-25', kind: 'space' },
    { part: 'switch-track', label: 'switch.track', token: '--helix-radius-full', kind: 'radius' },
    { part: 'switch-thumb', label: 'switch.thumb', value: '50%', kind: 'radius', meta: 'Always a full circle, independent of the track radius token' },
    { part: 'switch-root', label: 'display', value: 'flex' },
    { part: 'switch-root', label: 'flex-direction', value: 'column' },
    { part: 'switch-row', label: 'display', value: 'inline-flex' },
    { part: 'switch-row', label: 'align-items', value: 'center' },
    { part: 'switch-track', label: 'cursor', value: 'pointer' },
    { part: 'switch-track', label: 'cursor.disabled', value: 'not-allowed' },
  ],
  features: [
    'label — required accessible label',
    'description — optional helper copy below the row',
    'size — s or m track/thumb scale',
    'checked / defaultChecked — controlled or uncontrolled boolean state',
    'onChange fires immediately on toggle — no separate confirm step',
  ],
  examples: [
    { label: 'Default', code: `<Switch label="Enable notifications" />` },
    { label: 'With description', code: `<Switch label="Auto-save" description="Save changes as you type" />` },
    { label: 'Small', code: `<Switch label="Compact mode" size="s" />` },
    { label: 'Checked', code: `<Switch label="Dark mode" defaultChecked />` },
  ],
};
