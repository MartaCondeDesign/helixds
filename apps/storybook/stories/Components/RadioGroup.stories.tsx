import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { RadioGroup, RadioGroupDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const PLAN_OPTIONS = [
  { value: 'free',       label: 'Free',       description: 'Up to 3 editors, unlimited viewers' },
  { value: 'pro',        label: 'Pro',        description: '$15/mo per editor, all features' },
  { value: 'team',       label: 'Team',       description: '$12/mo per editor, shared billing' },
  { value: 'enterprise', label: 'Enterprise', description: 'Custom pricing, SSO, SLAs' },
];

const SIZE_OPTIONS = [
  { value: 'solo',  label: 'Just me' },
  { value: 'small', label: '2–10 people' },
  { value: 'mid',   label: '11–50 people' },
  { value: 'large', label: '50+ people' },
];

const meta: Meta<typeof RadioGroup> = {
  title:     'Components/RadioGroup',
  component:  RadioGroup,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(RadioGroupDoc),
  // Figma's order: the props that are Figma variants first, then the rest (each group in code order)
  args: {
    options: PLAN_OPTIONS,
    orientation: undefined,
    invalid: undefined,
    disabled: undefined,
    label: 'Plan',
    value: undefined,
    defaultValue: undefined,
    onChange: undefined,
    description: undefined,
    errorMessage: undefined,
    required: undefined,
    name: undefined,
  },
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  argTypes: { value: { control: false }, defaultValue: { control: false } }, // the story holds the value in state
  render: (args) => {
    const [value, setValue] = useState('pro');
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
};

export const Horizontal: Story = {
  args: { options: SIZE_OPTIONS, label: 'Team size', orientation: 'horizontal' },
  argTypes: { value: { control: false }, defaultValue: { control: false } }, // the story holds the value in state
  render: (args) => {
    const [value, setValue] = useState('');
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { description: { story: '`orientation="horizontal"` lays options in a row. Best for short labels.' } },
  },
};

export const Invalid: Story = {
  args: { value: '', invalid: true, errorMessage: 'Please select a plan to continue.' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'pro' },
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'free',       label: 'Free',       description: 'Available now' },
      { value: 'pro',        label: 'Pro',        description: 'Available now' },
      { value: 'enterprise', label: 'Enterprise', description: 'Contact sales', disabled: true },
    ],
    value: 'free',
    label: 'Plan',
  },
  argTypes: { value: { control: false }, defaultValue: { control: false } }, // the story holds the value in state
  render: (args) => {
    const [value, setValue] = useState('free');
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { description: { story: 'Individual options can be disabled while the group remains interactive.' } },
  },
};

export const Required: Story = {
  args: { required: true },
  parameters: {
    docs: { description: { story: '`required`: a plan must be chosen before the form submits (`aria-required` on the fieldset).' } },
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const free = canvas.getByRole('radio', { name: /Free/ });
    const pro = canvas.getByRole('radio', { name: /Pro/ });
    const team = canvas.getByRole('radio', { name: /Team/ });

    // Tab moves focus into the group (first option, nothing selected yet)
    await userEvent.tab();
    await expect(free).toHaveFocus();

    // Space selects the focused option
    await userEvent.keyboard('[Space]');
    await expect(free).toBeChecked();

    // Arrow keys move the selection
    await userEvent.keyboard('{ArrowDown}');
    await expect(pro).toHaveFocus();
    await expect(pro).toBeChecked();
    await userEvent.keyboard('{ArrowDown}');
    await expect(team).toBeChecked();
    await userEvent.keyboard('{ArrowUp}');
    await expect(pro).toBeChecked();
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab enters the group, Space selects, arrow keys move the selection.' } },
  },
};
