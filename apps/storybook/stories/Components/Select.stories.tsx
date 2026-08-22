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
  args: { label: 'Role', options: ROLES, placeholder: 'Choose a role…', size: 'm' },
  argTypes: {
     size: { control: 'select', options: ['s', 'm', 'l'] },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
        <Select label="Role" options={ROLES} value={value} onChange={setValue} placeholder="Choose a role…" />
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

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
      <Select label="Small"  size="s" options={ROLES} placeholder="size=s"           onChange={() => {}} />
      <Select label="Medium" size="m" options={ROLES} placeholder="size=m (default)" onChange={() => {}} />
      <Select label="Large"  size="l" options={ROLES} placeholder="size=l"           onChange={() => {}} />
    </div>
  ),
};
