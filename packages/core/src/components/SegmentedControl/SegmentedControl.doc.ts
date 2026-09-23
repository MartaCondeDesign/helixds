/** Machine-readable component documentation for the Helix SegmentedControl. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'SegmentedControl',
  purpose: 'Lets users switch between a small, fixed set of mutually exclusive modes or views, with no associated content panel.',
  contract: 'contracts/components/SegmentedControl.json',
  a11y: [
    '`role="radiogroup"` on the root, `role="radio"` + `aria-checked` on each option — not `tablist`/`tab`, since there is no associated panel that changes content (see ADR-012).',
    'Roving `tabIndex` — only the checked option is in the Tab order; arrow keys move both focus and selection between options.',
    '`label` is required and becomes the group\'s `aria-label` — this control has no visible legend.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'segmented-control-root', label: 'Track background', token: '--helix-segmentedControl-fill-track', kind: 'color' },
    { part: 'segmented-control-pill', label: 'Pill background', token: '--helix-segmentedControl-fill-pill', kind: 'color' },
    { part: 'segmented-control-item-label', label: 'Default text', token: '--helix-segmentedControl-text-default', kind: 'color' },
    { part: 'segmented-control-item-label', label: 'Checked text', token: '--helix-segmentedControl-text-checked', kind: 'color', meta: 'aria-checked="true"' },
    { part: 'segmented-control-root', label: 'root.radius', token: '--helix-segmentedControl-radius', kind: 'radius' },
    { part: 'segmented-control-item', label: 'item.height', token: '--helix-segmentedControl-height', kind: 'space', meta: 'semantic.size.s' },
    { part: 'segmented-control-root', label: 'root.padding', token: '--helix-segmentedControl-padding', kind: 'space' },
    { part: 'segmented-control-item', label: 'item.paddingX', token: '--helix-segmentedControl-paddingX', kind: 'space', axis: 'horizontal' },
    { part: 'segmented-control-item', label: 'item.fontSize', token: '--helix-segmentedControl-fontSize', kind: 'typography' },
    { part: 'segmented-control-item', label: 'item.fontWeight', token: '--helix-segmentedControl-fontWeight', kind: 'typography' },
    { part: 'segmented-control-root', label: 'display', value: 'inline-flex' },
    { part: 'segmented-control-item', label: 'position', value: 'relative' },
    { part: 'segmented-control-pill', label: 'position', value: 'absolute (inset: 0, behind label — same layering NavItem\'s indicator uses)' },
  ],
  features: [
    'label — required, becomes the group\'s accessible name',
    'options — array of { value, label, disabled? }',
    'value / defaultValue — controlled or uncontrolled selection',
    'onChange — selection change handler',
    'disabled — disables the whole group; individual options can also disable themselves',
    'The sliding pill reuses NavItem/Switch\'s Motion layoutId + SPRING_SNAPPY pattern — see ADR-012.',
  ],
  examples: [
    {
      label: 'Default',
      code: `<SegmentedControl label="Mode" options={[{ value: 'plan', label: 'Plan' }, { value: 'debug', label: 'Debug' }, { value: 'ask', label: 'Ask' }]} />`,
    },
    {
      label: 'Controlled',
      code: `<SegmentedControl label="Mode" options={options} value={mode} onChange={setMode} />`,
    },
    {
      label: 'With a disabled option',
      code: `<SegmentedControl label="Mode" options={[{ value: 'plan', label: 'Plan' }, { value: 'debug', label: 'Debug', disabled: true }, { value: 'ask', label: 'Ask' }]} />`,
    },
  ],
};
