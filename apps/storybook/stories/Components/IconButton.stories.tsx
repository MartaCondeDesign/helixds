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
import { IconButton, IconButtonDoc } from '@helix/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof IconButton> = {
  title:     'Components/IconButton',
  component:  IconButton,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(IconButtonDoc),
  args: {
    icon:    IconTrash,
    label:   'Delete item',
    variant: 'ghost',
    size:    'm',
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
  args: { variant: 'ghost', icon: IconDots, label: 'More actions' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', icon: IconPencil, label: 'Edit' },
};

export const Primary: Story = {
  args: { variant: 'primary', icon: IconSettings, label: 'Settings' },
};

export const Danger: Story = {
  args: { variant: 'danger', icon: IconTrash, label: 'Delete account' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap' }}>
      <IconButton size="s" icon={IconX} label="Dismiss" />
      <IconButton size="m" icon={IconX} label="Dismiss" />
      <IconButton size="l" icon={IconX} label="Dismiss" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All size variants. Default is `m`, same scale as Button.' } },
  },
};

export const Loading: Story = {
  args: { isLoading: true, icon: IconRefresh, label: 'Refresh' },
  parameters: {
    docs: {
      description: {
        story: '`isLoading` shows a spinner and sets `aria-busy="true"`. The button becomes non-interactive.',
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true, icon: IconTrash, label: 'Delete item' },
};

export const AllVariants: Story = {
  render: () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-125)' }}>
        {variants.map(variant => (
          <div key={variant} style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton variant={variant} icon={IconSettings} label={`${variant} default`} />
            <IconButton variant={variant} icon={IconSettings} label={`${variant} loading`} isLoading />
            <IconButton variant={variant} icon={IconSettings} label={`${variant} disabled`} disabled />
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
