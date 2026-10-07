/** Machine-readable component documentation for the Helix FAB. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name:     'FAB',
  purpose:  'A single, prominent floating action reachable from anywhere in the current view — optionally expanding into 1-3 closely related actions via a speed-dial.',
  contract: 'contracts/components/FAB.json',
  a11y: [
    '`label` is required — it is the only accessible name the trigger has, rendered as aria-label.',
    'aria-expanded is set on the trigger whenever `actions` is provided, reflecting the speed-dial state.',
    'Escape collapses an expanded speed-dial; so does a press outside the FAB.',
    'Never the only way to reach an action — it is a shortcut, not the sole path (see contract neverUseFor).',
  ],

  variants: [],

  sizes: ['m'],

  tokens: [
    { part: 'fab-root', label: 'fill.default', token: '--helix-fab-fill-default', kind: 'color' },
    { part: 'fab-root', label: 'fill.hover', token: '--helix-fab-fill-hover', kind: 'color', state: 'hover' },
    { part: 'fab-root', label: 'fill.press', token: '--helix-fab-fill-press', kind: 'color', state: 'press' },
    { part: 'fab-root', label: 'icon', token: '--helix-fab-icon', kind: 'color' },
    { part: 'fab-root', label: 'radius', token: '--helix-fab-radius', kind: 'radius', meta: 'semantic.radius.full — true circle' },
    { part: 'fab-root', label: 'shadow', token: '--helix-fab-shadow', kind: 'shadow', meta: 'ADR-005 amendment — FAB is the first non-overlay component allowed a shadow' },
    { part: 'fab-root', label: 'size.m', token: '--helix-fab-height', kind: 'space', size: 'm', meta: 'width = height (circle), single size — reuses semantic.size.xl (48px)' },
    { part: 'fab-action', label: 'size', token: '--helix-fab-action-height', kind: 'space', meta: '36px, local exception — revealed actions are smaller than the trigger' },
    { part: 'fab-action', label: 'fill', token: '--helix-fab-action-fill', kind: 'color', meta: 'White — same look as an IconButton secondary variant' },
    { part: 'fab-action', label: 'border', token: '--helix-fab-action-border', kind: 'color' },
    { part: 'fab-action', label: 'icon', token: '--helix-fab-action-icon', kind: 'color' },
  ],

  features: [
    'forwardRef — accepts a ref to the trigger <button>',
    'Speed-dial expand/collapse — actions fade/scale/slide in and out via Motion springs (ADR-007); see .ai/maps/patterns/motion-effects.md',
    'expanded/defaultExpanded/onExpandedChange — controlled or uncontrolled speed-dial state',
    'Escape and outside-press both collapse an expanded speed-dial',
    'The trigger icon rotates 45° while expanded — a plain "+" reads as a close affordance',
    'icon — a single required Tabler icon slot, rendered via Icon at 20px',
  ],

  examples: [
    {
      label: 'Plain FAB, no speed-dial',
      code: `<FAB icon={IconPlus} label="Add" onClick={() => {}} />`,
    },
    {
      label: 'Speed-dial with 2 actions',
      code: `<FAB
  icon={IconPlus}
  label="Add"
  actions={[
    { icon: IconUserPlus, label: 'Add member', onClick: () => {} },
    { icon: IconDownload, label: 'Export', onClick: () => {} },
  ]}
/>`,
    },
  ],
};
