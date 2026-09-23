import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SegmentedControl, SegmentedControlDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const MODE_OPTIONS = [
  { value: 'plan',  label: 'Plan' },
  { value: 'debug', label: 'Debug' },
  { value: 'ask',   label: 'Ask' },
];

const PERIOD_OPTIONS = [
  { value: 'day',   label: 'Day' },
  { value: 'week',  label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year',  label: 'Year' },
];

const meta: Meta<typeof SegmentedControl> = {
  title:     'Components/SegmentedControl',
  component:  SegmentedControl,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SegmentedControlDoc),
  args: { label: 'Mode', options: MODE_OPTIONS },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('plan');
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};

export const FourOptions: Story = {
  args: { label: 'Period', options: PERIOD_OPTIONS },
  render: (args) => {
    const [value, setValue] = useState('year');
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'plan',  label: 'Plan' },
      { value: 'debug', label: 'Debug', disabled: true },
      { value: 'ask',   label: 'Ask' },
    ],
  },
  render: (args) => {
    const [value, setValue] = useState('plan');
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { description: { story: 'Individual options can be disabled while the group remains interactive.' } },
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'plan' },
};
