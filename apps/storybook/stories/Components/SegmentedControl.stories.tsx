import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { IconChartBar, IconTable } from '@tabler/icons-react';
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

// Icon-only options: the label is still required — it's each option's accessible name.
export const IconOnly: Story = {
  args: {
    label: 'View',
    options: [
      { value: 'chart', label: 'Chart view', icon: IconChartBar },
      { value: 'table', label: 'Table view', icon: IconTable },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Chart view' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Table view' })).not.toBeChecked();
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'plan' },
};

export const KeyboardNavigation: Story = {
  render: (args) => {
    const [value, setValue] = useState('plan');
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plan = canvas.getByRole('radio', { name: 'Plan' });
    const debug = canvas.getByRole('radio', { name: 'Debug' });

    // Tab moves focus into the group — onto the checked option, the only one in the tab order
    await userEvent.tab();
    await expect(plan).toHaveFocus();

    // Arrow keys move focus and selection together
    await userEvent.keyboard('{ArrowRight}');
    await expect(debug).toHaveFocus();
    await expect(debug).toBeChecked();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(plan).toBeChecked();

    // Space / Enter select the focused option
    await userEvent.keyboard('[Space]');
    await expect(plan).toBeChecked();
    await userEvent.keyboard('{Enter}');
    await expect(plan).toBeChecked();

    // Tab moves out of the group in one step, not through every option
    await userEvent.tab();
    await expect(canvas.queryAllByRole('radio').some(r => r === document.activeElement)).toBe(false);
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab enters on the checked option, arrow keys move the selection, Space/Enter select, the next Tab leaves the group.' } },
  },
};
