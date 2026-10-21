import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import {
  IconTrash,
  IconX,
  IconRefresh,
  IconDots,
  IconPencil,
  IconSettings,
} from '@tabler/icons-react';
import { IconButton, IconButtonDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';
import { mapped } from '../_shared/mapped-arg';

const meta: Meta<typeof IconButton> = {
  title:     'Components/IconButton',
  component:  IconButton,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(IconButtonDoc),
  // Figma's order: the props that are Figma variants first, then the rest (each group in code order)
  args: {
    variant: 'ghost',
    size:    'm',
    isLoading: undefined,
    disabled: undefined,
    icon:    mapped('IconTrash'),
    label:   'Delete item',
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style. `ghost` = no background/border (default — the common case for toolbar/row-action icons).',
    },
    size: {
      control: 'select',
      options: ['s', 'm', 'l'],
      description: "Physical size, matches Button's scale: s → 24px, m → 32px (default), l → 40px. Width always equals height.",
    },
    icon: {
      control: 'select',
      options: ['IconTrash', 'IconX', 'IconRefresh', 'IconDots', 'IconPencil', 'IconSettings'],
      mapping: {
        IconTrash:    IconTrash,
        IconX:        IconX,
        IconRefresh:  IconRefresh,
        IconDots:     IconDots,
        IconPencil:   IconPencil,
        IconSettings: IconSettings,
      },
      description: 'The single icon — pass the icon component by reference.',
    },
    label: {
      control: 'text',
      description: 'Required accessible name — rendered as `aria-label`, since there is no visible text.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows a spinner in place of the icon and disables interaction. Sets `aria-busy="true"` automatically.',
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Ghost: Story = {
  args: { variant: 'ghost', icon: mapped('IconDots'), label: 'More actions' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', icon: mapped('IconPencil'), label: 'Edit' },
};

export const Primary: Story = {
  args: { variant: 'primary', icon: mapped('IconSettings'), label: 'Settings' },
};

export const Danger: Story = {
  args: { variant: 'danger', icon: mapped('IconTrash'), label: 'Delete account' },
};

export const Sizes: Story = {
  args: { icon: mapped('IconX'), label: 'Dismiss' },
  // The story fixes size (s / m / l) — icon, label, variant, isLoading… apply to all three
  argTypes: { size: { control: false } },
  render: ({ size: _size, ...args }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap' }}>
      <IconButton {...args} size="s" />
      <IconButton {...args} size="m" />
      <IconButton {...args} size="l" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All size variants. Default is `m`, same scale as Button.' } },
  },
};

export const Loading: Story = {
  args: { isLoading: true, icon: mapped('IconRefresh'), label: 'Refresh' },
  parameters: {
    docs: {
      description: {
        story: '`isLoading` shows a spinner and sets `aria-busy="true"`. The button becomes non-interactive.',
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true, icon: mapped('IconTrash'), label: 'Delete item' },
};

export const AllVariants: Story = {
  args: { icon: mapped('IconSettings') },
  // The story fixes variant × state (default / loading / disabled) and each one's label — icon and size apply to all
  argTypes: { variant: { control: false }, label: { control: false }, isLoading: { control: false }, disabled: { control: false } },
  render: ({ icon, size, onClick }) => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-125)' }}>
        {variants.map(variant => (
          <div key={variant} style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton size={size} onClick={onClick} variant={variant} icon={icon} label={`${variant} default`} />
            <IconButton size={size} onClick={onClick} variant={variant} icon={icon} label={`${variant} loading`} isLoading />
            <IconButton size={size} onClick={onClick} variant={variant} icon={icon} label={`${variant} disabled`} disabled />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Complete matrix: all variants × all states.' },
    },
  },
};

// Hidden from the sidebar and Docs (!dev, !autodocs) but still run by the test-runner — it's the
// keyboard play test ADR-018's "Keyboard" criterion reads.
export const KeyboardActivation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Delete item' });

    await userEvent.tab();
    await expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('[Space]');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: {
      description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab focuses the button, Enter and Space each activate it, same as a native `<button>`.' },
    },
  },
};
