import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
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
  args: { label: 'Status', options: STATUS, size: 's' },
  argTypes: {
    size: { control: 'select', options: ['s', 'm'] },
  },
};

export default meta;
type Story = StoryObj<typeof ChipGroup>;

export const Default: Story = {};

export const Sizes: Story = {
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-l)' }}>
      <ChipGroup {...args} size="s" />
      <ChipGroup {...args} size="m" />
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
  args: { disabled: true },
  parameters: {
    docs: { description: { story: '`disabled` — every chip disabled.' } },
  },
};

// Hidden from the sidebar and Docs (!dev, !autodocs) but still run by the test-runner — it's the
// keyboard play test ADR-018's "Keyboard" criterion reads.
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Tab moves into the group and from chip to chip
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Active' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Paused' })).toHaveFocus();
  },
};
