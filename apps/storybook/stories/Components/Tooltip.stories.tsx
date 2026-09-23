import type { Meta, StoryObj } from '@storybook/react';
import { IconTrash } from '@tabler/icons-react';
import { Tooltip, TooltipDoc, IconButton, Avatar } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Tooltip> = {
  title:     'Components/Tooltip',
  component:  Tooltip,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(TooltipDoc),
  args: {
    label: 'Delete',
    children: <IconButton icon={IconTrash} label="Delete" />,
    // No explicit placement — defaults to 'top' and auto-flips on its own if that would clip the
    // canvas's edge (ADR-009), same as every other Tooltip usage.
  },
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    expanded: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {},
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-300)', alignItems: 'center', padding: 'var(--helix-primitive-spacing-150)' }}>
      <Tooltip label="Top placement" placement="top"><IconButton icon={IconTrash} label="Delete" /></Tooltip>
      <Tooltip label="Bottom placement" placement="bottom"><IconButton icon={IconTrash} label="Delete" /></Tooltip>
      <Tooltip label="Left placement" placement="left"><IconButton icon={IconTrash} label="Delete" /></Tooltip>
      <Tooltip label="Right placement" placement="right"><IconButton icon={IconTrash} label="Delete" /></Tooltip>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All 4 placements, hover any trigger.' } },
  },
};

export const OnAvatar: Story = {
  args: {
    label: 'Ana García',
    children: <Avatar label="Ana García" />,
  },
  parameters: {
    docs: { description: { story: "Tooltip's other real usage — AvatarGroup wraps every Avatar in one of these to show the person's name on hover." } },
  },
};

export const AlwaysExpanded: Story = {
  args: { expanded: true },
  parameters: {
    docs: { description: { story: 'A controlled/always-visible case via the `expanded` prop — bypasses hover/focus entirely.' } },
  },
};
