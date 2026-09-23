import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import {
  IconPlus,
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
      options: ['s', 'm', 'l'],
      description: "Physical size: s → 24px, m → 32px (default — use unless there's a specific reason to deviate), l → 40px.",
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

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'The four variants, size m (default), side by side.' },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="primary" loading>Saving…</Button>
      <Button variant="secondary" loading>Saving…</Button>
      <Button variant="ghost" loading>Saving…</Button>
      <Button variant="danger" loading>Saving…</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '`loading` shows a spinner and sets `aria-busy="true"` — each variant keeps its own color, it never grays out.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="primary" disabled>Not available</Button>
      <Button variant="secondary" disabled>Not available</Button>
      <Button variant="ghost" disabled>Not available</Button>
      <Button variant="danger" disabled>Not available</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'A solid gray disabled state via dedicated disabled tokens — not opacity.' },
    },
  },
};

export const WithLeadingIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="primary" icon={IconPlus}>New item</Button>
      <Button variant="secondary" icon={IconPlus}>New item</Button>
      <Button variant="ghost" icon={IconPlus}>New item</Button>
      <Button variant="danger" icon={IconPlus}>New item</Button>
    </div>
  ),
};

export const WithTrailingIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="primary" iconEnd={IconArrowRight}>Continue</Button>
      <Button variant="secondary" iconEnd={IconArrowRight}>Continue</Button>
      <Button variant="ghost" iconEnd={IconArrowRight}>Continue</Button>
      <Button variant="danger" iconEnd={IconArrowRight}>Continue</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap' }}>
      <Button size="s">Small</Button>
      <Button size="m">Medium (default)</Button>
      <Button size="l">Large</Button>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All size variants. Default is `m`.' } },
  },
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
