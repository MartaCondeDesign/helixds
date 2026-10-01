/** Machine-readable component documentation for the Helix ChipGroup. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'ChipGroup',
  purpose: 'Lets users turn on any number of filters from a small, visible set, shown as toggle chips.',
  contract: 'contracts/components/ChipGroup.json',
  a11y: [
    'Renders a real `<fieldset>`/`<legend>` — the group `label` is the legend. `hideLabel` hides it visually but keeps it as the group\'s accessible name.',
    'Each option renders a real `Chip` — a toggle `<button>` with `aria-pressed` — so it inherits Chip\'s own a11y and CSS unchanged.',
    'Tab moves between chips; Enter or Space toggles the focused one.',
  ],
  variants: [],
  sizes: ['s', 'm'],
  tokens: [
    { part: 'chip-group-legend', label: 'Legend text', token: '--helix-color-text-neutral', kind: 'color' },
    { part: 'chip-group-description', label: 'Description text', token: '--helix-color-text-neutral-light', kind: 'color' },
    { part: 'chip-group-legend', label: 'legend', token: '--helix-textStyle-body-m-medium-fontSize', kind: 'typography', meta: 'body-m-medium, 14px' },
    { part: 'chip-group-description', label: 'description', token: '--helix-textStyle-body-s-regular-fontSize', kind: 'typography', meta: 'body-s-regular, 12px' },
    { part: 'chip-group', label: 'gap.legend.options', token: '--helix-spacing-xs', kind: 'space', axis: 'vertical', meta: '8px — form-field-spacing.md' },
    { part: 'chip-group-options', label: 'gap.chips', token: '--helix-spacing-2xs', kind: 'space', meta: '4px, between chips and between wrapped rows — group-spacing.md' },
    { part: 'chip-group-options', label: 'display', value: 'flex' },
    { part: 'chip-group-options', label: 'flex-wrap', value: 'wrap' },
  ],
  features: [
    'label — required legend for the group; hideLabel hides it visually',
    'options — array of { value, label, icon?, disabled? }',
    'value / defaultValue — controlled or uncontrolled multi-selection, as string[]',
    'onChange — receives the full updated set of selected values',
    'size — s (default) or m, applied to every chip',
    'disabled — disables the whole group; individual options can also disable themselves',
    'Composes real `Chip` instances internally — no duplicated visuals or tokens.',
  ],
  examples: [
    {
      label: 'Default',
      code: `<ChipGroup label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'archived', label: 'Archived' }]} />`,
    },
    {
      label: 'Controlled',
      code: `<ChipGroup label="Status" options={options} value={filters} onChange={setFilters} />`,
    },
    {
      label: 'Hidden label',
      code: `<ChipGroup label="Filters" hideLabel options={options} />`,
    },
  ],
};
