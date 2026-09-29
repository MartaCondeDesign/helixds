import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { IconPlus, IconUserPlus, IconDownload, IconPencil } from '@tabler/icons-react';
import { FAB, FABDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof FAB> = {
  title:     'Components/FAB',
  component:  FAB,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(FABDoc),
  args: {
    icon:  IconPlus,
    label: 'Add',
    onPress: fn(),
  },
  argTypes: {
    icon: {
      control: 'select',
      options: ['IconPlus', 'IconPencil'],
      mapping: { IconPlus, IconPencil },
      description: "The trigger's icon — pass the icon component by reference.",
    },
    label: {
      control: 'text',
      description: 'Required accessible name — rendered as `aria-label`, since there is no visible text.',
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FAB>;

export const Default: Story = {
  render: args => (
    <div style={{ position: 'relative', height: 160 }}>
      {/* Top-left corner. FAB expands its speed-dial upward (see FAB.tsx), so the wrapper leaves
          headroom above the trigger rather than pinning it to the container's literal top edge. */}
      <div style={{ position: 'absolute', top: 96, left: 0 }}>
        <FAB {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'A plain FAB with no speed-dial — `onPress` fires directly.' } },
  },
};

export const SpeedDial: Story = {
  args: {
    actions: [
      { icon: IconUserPlus, label: 'Add member', onPress: fn() },
      { icon: IconDownload, label: 'Export', onPress: fn() },
    ],
  },
  render: args => (
    <div style={{ position: 'relative', height: 220 }}>
      {/* Top-left corner. FAB expands its speed-dial upward (see FAB.tsx), so the wrapper leaves
          headroom above the trigger rather than pinning it to the container's literal top edge. */}
      <div style={{ position: 'absolute', top: 96, left: 0 }}>
        <FAB {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Two revealed actions. Press the trigger to expand/collapse — a Motion spring (ADR-007) fades/scales the actions out of and back into the trigger.',
      },
    },
  },
};

export const Expanded: Story = {
  args: {
    defaultExpanded: true,
    actions: [
      { icon: IconUserPlus, label: 'Add member', onPress: fn() },
      { icon: IconDownload, label: 'Export', onPress: fn() },
    ],
  },
  render: args => (
    <div style={{ position: 'relative', height: 220 }}>
      {/* Top-left corner. FAB expands its speed-dial upward (see FAB.tsx), so the wrapper leaves
          headroom above the trigger rather than pinning it to the container's literal top edge. */}
      <div style={{ position: 'absolute', top: 96, left: 0 }}>
        <FAB {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Rendered already expanded (`defaultExpanded`), so the morph-split state is visible without interaction.' } },
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: args => (
    <div style={{ position: 'relative', height: 160 }}>
      {/* Top-left corner. FAB expands its speed-dial upward (see FAB.tsx), so the wrapper leaves
          headroom above the trigger rather than pinning it to the container's literal top edge. */}
      <div style={{ position: 'absolute', top: 96, left: 0 }}>
        <FAB {...args} />
      </div>
    </div>
  ),
};

export const KeyboardSpeedDial: Story = {
  args: {
    actions: [
      { icon: IconUserPlus, label: 'Add member', onPress: fn() },
      { icon: IconDownload, label: 'Export', onPress: fn() },
    ],
  },
  render: args => (
    <div style={{ position: 'relative', height: 220 }}>
      <div style={{ position: 'absolute', top: 96, left: 0 }}>
        <FAB {...args} />
      </div>
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Add' });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    // Enter opens the speed-dial
    await userEvent.keyboard('{Enter}');
    await expect(args.onPress).toHaveBeenCalledTimes(1);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Tab moves through the revealed actions — they precede the trigger in DOM order, so it's Shift+Tab
    // from the trigger that reaches them
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole('button', { name: 'Export' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole('button', { name: 'Add member' })).toHaveFocus();

    // Escape collapses and returns focus to the trigger
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();

    // Space opens it too
    await userEvent.keyboard('[Space]');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
  parameters: {
    docs: {
      description: {
        story: 'Keyboard test (contract `a11y.keyboardNav`): Enter/Space toggle the speed-dial, Tab reaches the revealed actions, Escape collapses it and returns focus to the trigger.',
      },
    },
  },
};
