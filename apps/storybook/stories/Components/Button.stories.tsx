import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import {
  IconPlus,
  IconDownload,
  IconArrowRight,
  IconSearch,
  IconSend,
  IconCopy,
  IconCheck,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { Button, ButtonDoc } from '@helixds/react';
import type { ButtonProps } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';
import { mapped } from '../_shared/mapped-arg';

const meta: Meta<typeof Button> = {
  title:     'Components/Button',
  component:  Button,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(ButtonDoc),
  args: {
    children: 'Button',
    variant:  'primary',
    size:     'm',
    onClick:  fn(),
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
    isLoading: {
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
  // The story fixes variant and each button's label — size, icons, isLoading… apply to all four
  argTypes: { variant: { control: false }, children: { control: false } },
  render: ({ variant: _variant, children: _children, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="secondary">Secondary</Button>
      <Button {...args} variant="ghost">Ghost</Button>
      <Button {...args} variant="danger">Danger</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'The four variants, size m (default), side by side.' },
    },
  },
};

export const Loading: Story = {
  args: { children: 'Saving…' },
  // The story fixes isLoading (on) and variant (one of each) — label, size, icons apply to all four
  // iconEnd and disabled are off too: the spinner takes iconEnd's place, and a loading button is already inert
  argTypes: { variant: { control: false }, isLoading: { control: false }, iconEnd: { control: false }, disabled: { control: false } },
  render: ({ variant: _variant, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary" isLoading />
      <Button {...args} variant="secondary" isLoading />
      <Button {...args} variant="ghost" isLoading />
      <Button {...args} variant="danger" isLoading />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '`isLoading` shows a spinner and sets `aria-busy="true"` — each variant keeps its own color, it never grays out.',
      },
    },
  },
};

export const Disabled: Story = {
  args: { children: 'Not available' },
  // The story fixes disabled (on) and variant (one of each) — label, size, icons apply to all four
  argTypes: { variant: { control: false }, disabled: { control: false } },
  render: ({ variant: _variant, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary" disabled />
      <Button {...args} variant="secondary" disabled />
      <Button {...args} variant="ghost" disabled />
      <Button {...args} variant="danger" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'A solid gray disabled state via dedicated disabled tokens — not opacity.' },
    },
  },
};

export const WithLeadingIcon: Story = {
  args: { children: 'New item', icon: mapped('IconPlus') },
  // The story fixes variant (one of each) — label, icon, size… apply to all four
  argTypes: { variant: { control: false } },
  render: ({ variant: _variant, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary" />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="ghost" />
      <Button {...args} variant="danger" />
    </div>
  ),
};

export const WithTrailingIcon: Story = {
  args: { children: 'Continue', iconEnd: mapped('IconArrowRight') },
  // The story fixes variant (one of each) — label, iconEnd, size… apply to all four
  argTypes: { variant: { control: false } },
  render: ({ variant: _variant, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary" />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="ghost" />
      <Button {...args} variant="danger" />
    </div>
  ),
};

export const Sizes: Story = {
  // The story fixes size and each button's label — variant, icons, isLoading… apply to all three
  argTypes: { size: { control: false }, children: { control: false } },
  render: ({ size: _size, children: _children, ...args }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap' }}>
      <Button {...args} size="s">Small</Button>
      <Button {...args} size="m">Medium (default)</Button>
      <Button {...args} size="l">Large</Button>
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

type SwapProps = { size: ButtonProps['size'] };

function CopyButton({ size }: SwapProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <Button size={size} variant="secondary" icon={copied ? IconCheck : IconCopy} onClick={() => setCopied(true)}>
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}

function SaveButton({ size }: SwapProps) {
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!saving) return;
    const timer = window.setTimeout(() => setSaving(false), 1800);
    return () => window.clearTimeout(timer);
  }, [saving]);
  return (
    <Button size={size} icon={IconDeviceFloppy} isLoading={saving} onClick={() => setSaving(true)}>
      {saving ? 'Saving' : 'Save'}
    </Button>
  );
}

export const SwapInPlace: Story = {
  // Each button drives its own label, icon, variant and isLoading — size applies to both. disabled stays
  // off: the play test clicks "Copy link", and a disabled button can't swap.
  argTypes: {
    variant: { control: false }, children: { control: false }, icon: { control: false },
    iconEnd: { control: false }, isLoading: { control: false }, fullWidth: { control: false },
    disabled: { control: false },
  },
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center', flexWrap: 'wrap' }}>
      <CopyButton size={size} />
      <SaveButton size={size} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Copy link' }));
    // The outgoing label is aria-hidden, so the button's name is the new label straight away.
    await expect(canvas.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    await waitFor(() => expect(canvasElement.querySelector('[data-swapping]')).toBeNull());
  },
  parameters: {
    docs: {
      description: {
        story: 'Content that changes in place swaps instead of cutting: the icon cross-fades (copy → check, save → spinner) and the label cross-blurs while the button eases to its new width. Click either button. Under reduced motion the swap is instant.',
      },
    },
  },
};

// Hidden from the sidebar and Docs (!dev, !autodocs) but still run by the test-runner — it's the
// keyboard play test ADR-018's "Keyboard" criterion reads.
export const KeyboardActivation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { children: 'Save' },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Save' });

    await userEvent.tab();
    await expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('[Space]');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: {
      description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab focuses the button, Enter and Space each activate it.' },
    },
  },
};
