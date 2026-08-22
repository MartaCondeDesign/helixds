import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioGroup, RadioGroupDoc } from '@helix-ds/core';
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
  args: { label: 'Plan', options: PLAN_OPTIONS },
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('pro');
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
};

export const Horizontal: Story = {
  args: { options: SIZE_OPTIONS, label: 'Team size', orientation: 'horizontal' },
  render: (args) => {
    const [value, setValue] = useState('');
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { description: { story: '`orientation="horizontal"` lays options in a row. Best for short labels.' } },
  },
};

export const WithDescription: Story = {
  args: { description: 'You can change your plan at any time.' },
  render: (args) => {
    const [value, setValue] = useState('pro');
    return <RadioGroup {...args} value={value} onChange={setValue} />;
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
  render: (args) => {
    const [value, setValue] = useState('free');
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { description: { story: 'Individual options can be disabled while the group remains interactive.' } },
  },
};
