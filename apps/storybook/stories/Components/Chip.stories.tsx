import type { Meta, StoryObj } from '@storybook/react';
import {
  IconFilter,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import { Chip, ChipDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: createComponentDocsParameters(ChipDoc),
  args: {
    label: 'Chip',
    onPress: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['s', 'm'],
    },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    dismissible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Neutral: Story = { args: { label: 'All' } };
export const Checked: Story = { args: {
  label: 'Open',
  checked: true,
  size: "s"
} };
export const Info: Story = { args: { variant: 'info', label: 'Info' } };
export const Success: Story = { args: { variant: 'success', label: 'Approved' } };
export const Warning: Story = { args: { variant: 'warning', label: 'Pending' } };
export const Danger: Story = { args: { variant: 'danger', label: 'Blocked' } };

export const WithIcons: Story = {
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip size={size} label="Filter" icon={<IconFilter size={14} stroke={1.5} />} />
      <Chip size={size} label="Ready" variant="success" icon={<IconCheck size={14} stroke={1.5} />} />
      <Chip size={size} label="Soon" variant="warning" icon={<IconClock size={14} stroke={1.5} />} />
      <Chip size={size} label="Rejected" variant="danger" icon={<IconX size={14} stroke={1.5} />} />
    </div>
  ),
};

export const Dismissible: Story = {
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip size={size} label="Recent" dismissible onDismiss={() => {}} />
      <Chip size={size} label="Saved" checked dismissible onDismiss={() => {}} variant="info" />
      <Chip size={size} label="Archived" dismissible onDismiss={() => {}} variant="warning" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip size="s" label="Small" />
      <Chip size="m" label="Medium" />
      <Chip size="s" checked label="Small checked" />
      <Chip size="m" checked label="Medium checked" variant="info" icon={<IconAlertTriangle size={14} stroke={1.5} />} />
    </div>
  ),
};
