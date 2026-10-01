import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import {
  IconFilter,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Chip, ChipDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: createComponentDocsParameters(ChipDoc),
  args: {
    label: 'Chip',
    variant: 'neutral',
    size: 's',
    onPress: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['xs', 's', 'm'],
    },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    dismissible: { control: 'boolean' },
    onDismiss: {
      control: false,
      table: { category: 'Events' },
      description: 'Fires after a Motion fade+scale exit finishes, not on click itself (ADR-007) — the chip stays visible until the exit animation completes, then this callback runs, so removing it from a list lands exactly as it goes invisible. See .ai/maps/patterns/motion-effects.md.',
    },
    icon: {
      control: 'select',
      options: ['None', 'IconFilter', 'IconCheck', 'IconAlertTriangle', 'IconClock', 'IconX'],
      mapping: { None: undefined, IconFilter, IconCheck, IconAlertTriangle, IconClock, IconX },
      description: 'Leading icon — pass the icon component by reference, or "None" to remove it.',
    },
    iconEnd: {
      control: 'select',
      options: ['None', 'IconFilter', 'IconCheck', 'IconAlertTriangle', 'IconClock', 'IconX'],
      mapping: { None: undefined, IconFilter, IconCheck, IconAlertTriangle, IconClock, IconX },
      description: 'Trailing icon — same reference convention as `icon`, or "None" to remove it.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

const VARIANTS = ['neutral', 'warning', 'info', 'success', 'danger'] as const;

export const Unchecked: Story = {
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      {VARIANTS.map(variant => (
        <Chip key={variant} size={size} variant={variant} label={variant} />
      ))}
    </div>
  ),
};

export const Checked: Story = {
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      {VARIANTS.map(variant => (
        <Chip key={variant} size={size} variant={variant} label={variant} checked />
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip size={size} label="Filter" icon={IconFilter} />
      <Chip size={size} label="Ready" variant="success" icon={IconCheck} />
      <Chip size={size} label="Soon" variant="warning" icon={IconClock} />
      <Chip size={size} label="Rejected" variant="danger" icon={IconX} />
      <Chip size={size} label="Info" variant="info" icon={IconInfoCircle} />
    </div>
  ),
};

export const Dismissible: Story = {
  // Default is neutral (gray) via meta.args — dismissible chips are a removable-item pattern (recent
  // searches, attached files), not primarily a status/variant showcase (see AllVariants for that) — but
  // the variant control still works here like every other story, it just starts on neutral.
  render: ({ variant }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip size="s" variant={variant} label="Recent" dismissible onDismiss={() => {}} />
      <Chip size="s" variant={variant} label="Saved" checked dismissible onDismiss={() => {}} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip size="xs" label="Extra small" />
      <Chip size="s" label="Small" />
      <Chip size="m" label="Medium" />
      <Chip size="xs" label="Dismissible xs" dismissible onDismiss={() => {}} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'xs 24px (compact rows, e.g. removable filters) · s 28px (default; fits inside a 32px field — MultiSelect) · m 32px.' } },
  },
};

export const KeyboardActivation: Story = {
  args: { label: 'Filter', onPress: fn() },
  play: async ({ args, canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Filter' });

    await userEvent.tab();
    await expect(chip).toHaveFocus();

    // Enter and Space each activate it
    await userEvent.keyboard('{Enter}');
    await expect(args.onPress).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('[Space]');
    await expect(args.onPress).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Enter and Space each activate the focused chip.' } },
  },
};
