import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Chart, ChartDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const meta: Meta<typeof Chart> = {
  title:     'Components/Chart',
  component:  Chart,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(ChartDoc),
  args: {
    variant: 'line',
    // categories and series are Figma variants too (how many points / slices, how many series) — so they lead
    categories: months,
    series: [{ name: 'Active users', data: [1200, 1350, 1310, 1580, 1720, 1900] }],
    label: 'Monthly active users',
    description: 'Active users grew steadily through the first half of the year.',
    height: 280,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['line', 'area', 'bar', 'stacked-bar', 'donut', 'timeline'],
    },
    categories:  { control: 'object' },
    series:      { control: 'object' },
    label:       { control: 'text' },
    description: { control: 'text' },
    height:      { control: 'number' },
    className:   { control: 'text' },
  },
  render: args => <div style={{ width: '560px' }}><Chart {...args} /></div>,
};

export default meta;
type Story = StoryObj<typeof Chart>;

export const Default: Story = {};

export const Line: Story = { args: { variant: 'line' } };

export const Area: Story = {
  args: {
    variant: 'area',
    label: 'Storage used',
    description: 'Storage use rose every month.',
    series: [{ name: 'GB', data: [40, 46, 51, 58, 66, 71] }],
  },
};

export const Bar: Story = {
  args: {
    variant: 'bar',
    label: 'Revenue by month',
    description: 'May was the strongest month.',
    series: [
      { name: '2025', data: [18, 21, 19, 24, 27, 25] },
      { name: '2026', data: [22, 24, 23, 28, 33, 30] },
    ],
  },
};

// Keyboard: Tab reaches each legend toggle, Space/Enter hides and shows its series (contract a11y.keyboardNav).
export const LegendToggle: Story = {
  args: Bar.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: '2025' });
    const second = canvas.getByRole('button', { name: '2026' });

    await userEvent.tab();
    await expect(first).toHaveFocus();
    await expect(first).toHaveAttribute('aria-pressed', 'true');

    await userEvent.keyboard(' ');
    await expect(first).toHaveAttribute('aria-pressed', 'false');
    await userEvent.keyboard('{Enter}');
    await expect(first).toHaveAttribute('aria-pressed', 'true');

    await userEvent.tab();
    await expect(second).toHaveFocus();
  },
};

// One series: the legend is a plain label — nothing to toggle, so no button and no hover.
export const SingleSeriesLegend: Story = {
  args: Area.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

export const StackedBar: Story = {
  args: {
    variant: 'stacked-bar',
    label: 'Tickets by priority',
    description: 'Low-priority tickets make up most of the volume.',
    series: [
      { name: 'High', data: [4, 6, 5, 3, 7, 4] },
      { name: 'Medium', data: [10, 12, 9, 11, 13, 10] },
      { name: 'Low', data: [20, 18, 22, 25, 21, 24] },
    ],
  },
};

export const Donut: Story = {
  args: {
    variant: 'donut',
    label: 'Traffic by source',
    description: 'Search brings in about half of all visits.',
    categories: ['Search', 'Direct', 'Social', 'Referral'],
    series: [{ name: 'Visits', data: [52, 24, 15, 9] }],
  },
};

export const Timeline: Story = {
  args: {
    variant: 'timeline',
    label: 'Deployments per week',
    description: 'Deploy cadence dipped in week 4. Missing weeks leave a gap.',
    categories: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    series: [{ name: 'Deploys', data: [5, 7, 6, 2, null, 8] }],
  },
};
