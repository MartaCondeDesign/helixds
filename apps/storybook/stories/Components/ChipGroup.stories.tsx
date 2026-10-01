import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { IconCircleCheck, IconPlayerPause, IconArchive } from '@tabler/icons-react';
import { ChipGroup, ChipGroupDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const STATUS = [
  { value: 'active',   label: 'Active' },
  { value: 'paused',   label: 'Paused' },
  { value: 'draft',    label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const meta: Meta<typeof ChipGroup> = {
  title:     'Components/ChipGroup',
  component:  ChipGroup,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(ChipGroupDoc),
  args: { label: 'Status', options: STATUS, size: 's', onChange: fn() },
  argTypes: {
    size: { control: 'select', options: ['s', 'm'] },
  },
};

export default meta;
type Story = StoryObj<typeof ChipGroup>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultValue: ['active', 'draft'] },
  parameters: {
    docs: { description: { story: 'checked — each filter that is on renders as a checked Chip (`aria-pressed="true"`).' } },
  },
};

export const Sizes: Story = {
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-l)' }}>
      <ChipGroup {...args} label="Small" size="s" />
      <ChipGroup {...args} label="Medium" size="m" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 's 24px (default) · m 32px — Chip\'s own sizes, applied to every chip in the group.' } },
  },
};

export const WithIcons: Story = {
  args: {
    options: [
      { value: 'active',   label: 'Active',   icon: IconCircleCheck },
      { value: 'paused',   label: 'Paused',   icon: IconPlayerPause },
      { value: 'archived', label: 'Archived', icon: IconArchive },
    ],
  },
};

export const WithDescription: Story = {
  args: { description: 'Show projects in any of these states.' },
};

export const HiddenLabel: Story = {
  args: { label: 'Filter by status', hideLabel: true },
  parameters: {
    docs: { description: { story: '`hideLabel` hides the legend visually; it stays the group\'s accessible name.' } },
  },
};

export const Wrapping: Story = {
  args: {
    label: 'Skills',
    options: ['Design', 'Research', 'Frontend', 'Backend', 'Writing', 'Data', 'Product', 'Marketing']
      .map(l => ({ value: l.toLowerCase(), label: l })),
  },
  decorators: [Story => <div style={{ maxWidth: 280 }}><Story /></div>],
  parameters: {
    docs: { description: { story: 'When the chips don\'t fit on one line they wrap — rows sit 4px apart, same as the chips.' } },
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: ['active'],
    options: [...STATUS.slice(0, 3), { value: 'archived', label: 'Archived', disabled: true }],
  },
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-l)' }}>
      <ChipGroup {...args} label="One option disabled" />
      <ChipGroup {...args} label="Whole group disabled" disabled />
    </div>
  ),
};

// Hidden from the sidebar and Docs (!dev, !autodocs) but still run by the test-runner — it's the
// keyboard play test ADR-018's "Keyboard" criterion reads.
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByRole('button', { name: 'Active' });
    const paused = canvas.getByRole('button', { name: 'Paused' });

    // Tab moves into the group and between chips
    await userEvent.tab();
    await expect(active).toHaveFocus();
    await userEvent.tab();
    await expect(paused).toHaveFocus();

    // Enter and Space each toggle the focused chip
    await userEvent.keyboard('{Enter}');
    await expect(paused).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith(['paused']);
    await userEvent.keyboard('[Space]');
    await expect(paused).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onChange).toHaveBeenLastCalledWith([]);
  },
};
