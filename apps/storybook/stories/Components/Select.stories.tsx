import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select, SelectDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const ROLES = [
  { value: 'designer', label: 'Designer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'pm',       label: 'Product Manager' },
  { value: 'lead',     label: 'Tech Lead' },
  { value: 'other',    label: 'Other' },
];

const GROUPED = [
  {
    label: 'Design',
    options: [
      { value: 'ui', label: 'UI Designer' },
      { value: 'ux', label: 'UX Researcher' },
      { value: 'ds', label: 'Design Systems' },
    ],
  },
  {
    label: 'Engineering',
    options: [
      { value: 'fe', label: 'Frontend' },
      { value: 'be', label: 'Backend' },
      { value: 'fs', label: 'Full-stack' },
    ],
  },
];

const meta: Meta<typeof Select> = {
  title:     'Components/Select',
  component:  Select,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SelectDoc),
  // w-[300px] — a true fixed width, not min-width. Without a consumer-set width at all, the
  // trigger's width is driven by whichever option's label is currently selected and visibly
  // shrinks/grows as the selection changes (e.g. "Product Manager" vs "PM"); min-width alone only
  // stops it shrinking below a floor, it can still grow past that for a longer label — the trigger
  // now truncates a label that doesn't fit with an ellipsis (select-trigger-label) instead of
  // growing the box, matching a native <select>'s own behavior at a fixed width. Select has no
  // built-in default per CLAUDE.md's min-width policy (a consumer/pattern decision, not a system
  // token) — this is the demonstrated example default.
  args: { label: 'Role', options: ROLES, placeholder: 'Choose a role…', className: 'w-[300px]' },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
        <Select label="Role" options={ROLES} value={value} onChange={setValue} placeholder="Choose a role…" className="w-[300px]" />
        {value && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--helix-color-text-neutral-light)' }}>
            Selected: <strong>{value}</strong>
          </p>
        )}
      </div>
    );
  },
};

export const WithGroups: Story = {
  args: { options: GROUPED, label: 'Specialty', placeholder: 'Select specialty…' },
  parameters: {
    docs: { description: { story: 'Pass `{ label, options }[]` for grouped `<optgroup>` rendering.' } },
  },
};

export const WithDescription: Story = {
  args: { description: 'Used to assign permissions on this workspace.' },
};

export const Invalid: Story = {
  args: { invalid: true, errorMessage: 'Please select a role to continue.' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'designer' },
};
