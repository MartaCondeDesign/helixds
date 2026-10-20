import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { IconTrash } from '@tabler/icons-react';
import { Tooltip, TooltipDoc, IconButton, Avatar } from '@helixds/react';
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
    controls: { disable: true },
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

export const KeyboardFocus: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Delete' });
    // hidden: true — the content is `visibility: hidden` until shown, which excludes it from the
    // accessibility tree getByRole searches by default
    const tooltip = canvas.getByRole('tooltip', { hidden: true });

    await expect(tooltip).not.toBeVisible();

    // Tab focuses the trigger, which shows the tooltip
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    await waitFor(() => expect(tooltip).toBeVisible());

    // Escape dismisses it
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tooltip).not.toBeVisible());
    await expect(trigger).toHaveFocus(); // dismissing the tooltip doesn't move focus off its trigger
  },
  parameters: {
    docs: {
      description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab focuses the trigger and shows the tooltip, Escape dismisses it.' },
    },
  },
};
