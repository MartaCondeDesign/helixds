/** Machine-readable component documentation for the Helix ChipGroup. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'ChipGroup',
  purpose: 'Shows a small set of related chips side by side — categories, tags or applied filters — as one labelled group.',
  contract: 'contracts/components/ChipGroup.json',
  a11y: [
    'role="group" named by `label` (aria-label) — the label is never visible; the chips stand on their own.',
    'Each option renders a real `Chip`, so it inherits Chip\'s own a11y and CSS unchanged.',
    'Tab moves between chips.',
  ],
  variants: [],
  sizes: ['s', 'm'],
  tokens: [
    { part: 'chip-group', label: 'gap.chips', token: '--helix-spacing-2xs', kind: 'space', meta: '4px, between chips and between wrapped rows — group-spacing.md' },
    { part: 'chip-group', label: 'display', value: 'flex' },
    { part: 'chip-group', label: 'flex-wrap', value: 'wrap' },
  ],
  features: [
    'label — required accessible name for the group (aria-label); never shown',
    'options — array of { value, label, icon?, disabled? }',
    'size — s (default) or m, applied to every chip',
    'disabled — disables every chip; individual options can also disable themselves',
    'Composes real `Chip` instances internally — no duplicated visuals or tokens.',
  ],
  examples: [
    {
      label: 'Default',
      code: `<ChipGroup label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'archived', label: 'Archived' }]} />`,
    },
  ],
};
