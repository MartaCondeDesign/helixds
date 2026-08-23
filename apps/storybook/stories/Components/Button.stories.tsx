import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import {
  IconPlus,
  IconTrash,
  IconDownload,
  IconArrowRight,
  IconSearch,
  IconSend,
} from '@tabler/icons-react';
import { Button, ButtonDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Button> = {
  title:     'Components/Button',
  component:  Button,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(ButtonDoc),
  args: {
    children: 'Button',
    variant:  'primary',
    size:     'm',
    onPress:  fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style. `primary` = brand-filled; `secondary` = outlined; `ghost` = no border; `danger` = red-filled.',
    },
    size: {
      control: 'select',
      options: ['xs', 's', 'm', 'l', 'xl'],
      description: 'Physical size: xs → 16px height, s → 24px, m → 32px, l → 40px, xl → 48px.',
    },
    loading: {
      control: 'boolean',
      description: 'Shows a spinner and disables interaction. Sets `aria-busy="true"` automatically.',
    },
    disabled: { control: 'boolean' },
    fullWidth: {
      control: 'boolean',
      description: 'Expands to 100% of container width.',
    },
    icon: {
      control: 'select',
      options: ['none', 'IconPlus', 'IconSearch', 'IconDownload'],
      mapping: {
        none:         undefined,
        IconPlus:     IconPlus,
        IconSearch:   IconSearch,
        IconDownload: IconDownload,
      },
      description: 'Leading icon — pass the icon component by reference. Select an icon or "none".',
    },
    iconEnd: {
      control: 'select',
      options: ['none', 'IconArrowRight', 'IconSend'],
      mapping: {
        none:          undefined,
        IconArrowRight: IconArrowRight,
        IconSend:       IconSend,
      },
      description: 'Trailing icon — same reference convention as icon. Select an icon or "none".',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Save changes' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Learn more' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete account' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap' }}>
      <Button size="xs">Extra small</Button>
      <Button size="s">Small</Button>
      <Button size="m">Medium</Button>
      <Button size="l">Large</Button>
      <Button size="xl">Extra large</Button>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All size variants. Default is `m`.' } },
  },
};

export const WithLeadingIcon: Story = {
  args: { icon: IconPlus, children: 'New item' },
};

export const WithTrailingIcon: Story = {
  args: { iconEnd: IconArrowRight, children: 'Continue' },
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving…' },
  parameters: {
    docs: {
      description: {
        story: '`loading` shows a spinner and sets `aria-busy="true"`. The button becomes non-interactive.',
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Not available' },
};

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Submit' },
  decorators: [
    Story => (
      <div style={{ maxWidth: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export const AllVariants: Story = {
  render: () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-125)' }}>
        {variants.map(variant => (
          <div key={variant} style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant={variant}>{variant}</Button>
            <Button variant={variant} icon={IconPlus}>{variant} + icon</Button>
            <Button variant={variant} loading>Loading</Button>
            <Button variant={variant} disabled>Disabled</Button>
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

export const DangerWithConfirmation: Story = {
  render: () => {
    const [confirming, setConfirming] = useState(false);
    return (
      <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)' }}>
        {confirming ? (
          <>
            <Button variant="secondary" onPress={() => setConfirming(false)}>Cancel</Button>
            <Button variant="danger" icon={IconTrash} onPress={() => setConfirming(false)}>
              Yes, delete
            </Button>
          </>
        ) : (
          <Button variant="danger" onPress={() => setConfirming(true)}>Delete account</Button>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Danger confirmation pattern: show Cancel + Confirm pair before destructive action.',
      },
    },
  },
};
