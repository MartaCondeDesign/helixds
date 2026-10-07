import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { CheckboxGroup, CheckboxGroupDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const NOTIFICATION_OPTIONS = [
  { value: 'comments', label: 'Comments',    description: 'Replies to your posts and threads' },
  { value: 'mentions',  label: 'Mentions',    description: 'When someone @-mentions you' },
  { value: 'digest',    label: 'Weekly digest', description: 'A summary of activity every Monday' },
];

const DAY_OPTIONS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
];

const meta: Meta<typeof CheckboxGroup> = {
  title:     'Components/CheckboxGroup',
  component:  CheckboxGroup,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(CheckboxGroupDoc),
  args: { label: 'Notify me about', options: NOTIFICATION_OPTIONS },
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(['comments']);
    return <CheckboxGroup {...args} value={value} onChange={setValue} />;
  },
};

export const Horizontal: Story = {
  args: { options: DAY_OPTIONS, label: 'Repeat on', orientation: 'horizontal' },
  render: (args) => {
    const [value, setValue] = useState<string[]>(['mon', 'wed', 'fri']);
    return <CheckboxGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { description: { story: '`orientation="horizontal"` lays options in a row. Best for short labels.' } },
  },
};

export const Invalid: Story = {
  args: { value: [], invalid: true, errorMessage: 'Choose at least one topic.' },
};

export const Disabled: Story = {
  args: { disabled: true, value: ['comments'] },
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'comments', label: 'Comments' },
      { value: 'mentions',  label: 'Mentions' },
      { value: 'digest',    label: 'Weekly digest', disabled: true },
    ],
    value: ['comments'],
    label: 'Notify me about',
  },
  render: (args) => {
    const [value, setValue] = useState<string[]>(['comments']);
    return <CheckboxGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { description: { story: 'Individual options can be disabled while the group remains interactive.' } },
  },
};

export const Required: Story = {
  args: { required: true, defaultValue: [] },
  parameters: {
    docs: { description: { story: '`required`: at least one option must be selected before the form submits (`aria-required` on the fieldset).' } },
  },
};

export const KeyboardToggle: Story = {
  args: { defaultValue: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const comments = canvas.getByRole('checkbox', { name: /Comments/ });
    const mentions = canvas.getByRole('checkbox', { name: /Mentions/ });

    // Tab moves into the group, then between options
    await userEvent.tab();
    await expect(comments).toHaveFocus();
    await userEvent.tab();
    await expect(mentions).toHaveFocus();

    // Space toggles the focused option only
    await userEvent.keyboard('[Space]');
    await expect(mentions).toBeChecked();
    await expect(comments).not.toBeChecked();
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab moves between options, Space toggles the focused one.' } },
  },
};
