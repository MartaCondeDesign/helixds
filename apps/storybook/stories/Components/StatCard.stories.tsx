import type { Meta, StoryObj } from '@storybook/react';
import { StatCard, StatCardDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof StatCard> = {
  title:     'Components/StatCard',
  component:  StatCard,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(StatCardDoc),
  args: { label: 'Members', value: '6', delta: '+2 vs last month', trend: 'up' },
  argTypes: {
    trend: {
      control: 'select',
      options: [undefined, 'up', 'down'],
    },
    label: { control: 'text' },
    value: { control: 'text' },
    delta: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = { args: {} };

export const DownTrend: Story = {
  args: { label: 'Token coverage', value: '89%', delta: '-2pp vs last month', trend: 'down' },
};

export const NoDelta: Story = {
  args: { label: 'Components', value: '103', delta: undefined, trend: undefined },
};

export const KpiRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', flexWrap: 'wrap' }}>
      <StatCard label="Members" value="6" delta="+2" trend="up" />
      <StatCard label="Active" value="4" delta="+1" trend="up" />
      <StatCard label="Components" value="103" delta="+14" trend="up" />
      <StatCard label="Token coverage" value="89%" delta="-2pp" trend="down" />
    </div>
  ),
};
