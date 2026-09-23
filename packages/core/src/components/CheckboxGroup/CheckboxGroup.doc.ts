/** Machine-readable component documentation for the Helix CheckboxGroup. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'CheckboxGroup',
  purpose: 'Lets users choose zero or more options from a small, visible set of independent choices.',
  contract: 'contracts/components/CheckboxGroup.json',
  a11y: [
    'Renders a real `<fieldset>`/`<legend>` — the group `label` is the legend, not a per-option label.',
    'Each option renders a real, standalone `Checkbox` — no bespoke markup, so it inherits all of Checkbox\'s own a11y and CSS unchanged.',
    'Pair `invalid` with `errorMessage` so screen readers get a clear validation message.',
  ],
  variants: [
    { name: 'vertical', description: 'Default orientation — options stack top to bottom.' },
    { name: 'horizontal', description: 'Options lay out left to right. Use for short option sets only.' },
  ],
  sizes: [],
  tokens: [
    { part: 'checkbox-group-legend', label: 'Group label text', token: '--helix-checkbox-text-label', kind: 'color' },
    { part: 'checkbox-group-error', label: 'Error text', token: '--helix-checkbox-text-error', kind: 'color' },
    { part: 'checkbox-group-legend', label: 'legend', token: '--helix-primitive-fontSize-s', kind: 'typography', meta: 'Label' },
    { part: 'checkbox-group-legend', label: 'legend.weight', token: '--helix-primitive-fontWeight-medium', kind: 'typography', meta: 'Medium' },
    { part: 'checkbox-group', label: 'gap.legend.options', token: '--helix-primitive-spacing-50', kind: 'space', axis: 'vertical' },
    { part: 'checkbox-group-options', label: 'gap.options', token: '--helix-primitive-spacing-75', kind: 'space', axis: 'vertical' },
    { part: 'checkbox-group', label: 'display', value: 'flex' },
    { part: 'checkbox-group', label: 'flex-direction', value: 'column' },
    { part: 'checkbox-group-options', label: 'display', value: 'flex' },
    { part: 'checkbox-group-options', label: 'flex-direction', value: 'column' },
  ],
  features: [
    'label — required legend for the whole group',
    'options — array of { value, label, description?, disabled? }',
    'orientation — vertical (default) or horizontal layout',
    'value / defaultValue — controlled or uncontrolled multi-selection, as string[]',
    'onChange — receives the full updated set of selected values, not a single toggle event',
    'invalid / errorMessage — group-level validation state and helper copy',
    'disabled — disables the whole group; individual options can also disable themselves',
    'Composes real `Checkbox` instances internally — no duplicated visuals or tokens.',
  ],
  examples: [
    {
      label: 'Default',
      code: `<CheckboxGroup label="Notify me about" options={[{ value: 'comments', label: 'Comments' }, { value: 'mentions', label: 'Mentions' }]} />`,
    },
    {
      label: 'With descriptions',
      code: `<CheckboxGroup label="Notify me about" options={[{ value: 'comments', label: 'Comments', description: 'Replies to your posts' }, { value: 'mentions', label: 'Mentions', description: 'When someone @-mentions you' }]} />`,
    },
    {
      label: 'Horizontal',
      code: `<CheckboxGroup label="Days" orientation="horizontal" options={[{ value: 'mon', label: 'Mon' }, { value: 'tue', label: 'Tue' }, { value: 'wed', label: 'Wed' }]} />`,
    },
    {
      label: 'Invalid',
      code: `<CheckboxGroup label="Topics" options={options} invalid errorMessage="Choose at least one topic" />`,
    },
  ],
};
