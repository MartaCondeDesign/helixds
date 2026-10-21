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
import { Chip, ChipDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: createComponentDocsParameters(ChipDoc),
  // Figma's order: the props that are Figma variants first, then the rest (each group in code order)
  args: {
    variant: 'neutral',
    size: 's',
    disabled: undefined,
    label: 'Chip',
    onClick: () => {},
    dismissible: undefined,
    icon: undefined,
    iconEnd: undefined,
    onDismiss: undefined,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['s', 'm'],
    },
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

// Every render spreads the story's args, so each control in the panel (disabled, icon,
// dismissible…) works in every story — only what the story is about (its variants, sizes or labels)
// is fixed per chip. onDismiss is always wired so the dismissible control has an effect too.
const ROW = { display: 'flex', gap: 'var(--helix-spacing-2xs)', flexWrap: 'wrap', alignItems: 'center' } as const;

export const Dismissible: Story = {
  // Default is neutral (gray) via meta.args — dismissible chips are a removable-item pattern (recent
  // searches, attached files), not primarily a status/variant showcase.
  args: { dismissible: true },
  argTypes: { label: { control: false } }, // each chip's label is fixed
  render: args => (
    <div style={ROW}>
      <Chip {...args} label="Recent" onDismiss={() => {}} />
      <Chip {...args} label="Saved" onDismiss={() => {}} />
    </div>
  ),
};

export const Variants: Story = {
  argTypes: { variant: { control: false }, label: { control: false } }, // one chip per variant, labelled by it
  render: args => (
    <div style={ROW}>
      {VARIANTS.map(variant => (
        <Chip key={variant} {...args} variant={variant} label={variant} onDismiss={() => {}} />
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  argTypes: { label: { control: false }, icon: { control: false } }, // each chip's label and icon are fixed
  render: args => (
    <div style={ROW}>
      <Chip {...args} label="Filter" icon={IconFilter} onDismiss={() => {}} />
      <Chip {...args} label="Ready" variant="success" icon={IconCheck} onDismiss={() => {}} />
      <Chip {...args} label="Soon" variant="warning" icon={IconClock} onDismiss={() => {}} />
      <Chip {...args} label="Rejected" variant="danger" icon={IconX} onDismiss={() => {}} />
      <Chip {...args} label="Info" variant="info" icon={IconInfoCircle} onDismiss={() => {}} />
    </div>
  ),
};

export const Sizes: Story = {
  argTypes: { size: { control: false }, label: { control: false } }, // one chip per size, labelled by it
  render: args => (
    <div style={ROW}>
      <Chip {...args} size="s" label="Small" onDismiss={() => {}} />
      <Chip {...args} size="m" label="Medium" onDismiss={() => {}} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 's 24px (default — also the size inside MultiSelect\'s 32px field) · m 32px.' } },
  },
};

// Hidden from the sidebar and Docs (!dev, !autodocs) but still run by the test-runner — it's the
// keyboard play test ADR-018's "Keyboard" criterion reads.
export const KeyboardActivation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Filter', onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Filter' });

    await userEvent.tab();
    await expect(chip).toHaveFocus();

    // Enter and Space each activate it
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('[Space]');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Enter and Space each activate the focused chip.' } },
  },
};
