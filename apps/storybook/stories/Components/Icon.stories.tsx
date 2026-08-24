import type { Meta, StoryObj } from '@storybook/react';
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconSearch,
  IconArrowRight,
} from '@tabler/icons-react';
import { Icon, IconDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Icon> = {
  title:     'Components/Icon',
  component:  Icon,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(IconDoc),
  args: { icon: IconPlus, size: 16, decorative: true },
  argTypes: {
    icon: { control: false },
    size: {
      control: 'select',
      options: [12, 14, 16, 18, 20, 24, 32],
    },
    stroke: { control: 'number' },
    decorative: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = { args: { icon: IconPlus } };

export const IconOnly: Story = {
  args: { icon: IconTrash, decorative: false, label: 'Delete' },
  parameters: {
    docs: { description: { story: 'decorative=false with a label renders role="img" aria-label instead of aria-hidden — required whenever the icon is the only content, with no adjacent visible text.' } },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
      {[12, 14, 16, 18, 20, 24, 32].map(size => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--helix-primitive-spacing-25)' }}>
          <Icon icon={IconSearch} size={size as 12 | 14 | 16 | 18 | 20 | 24 | 32} />
          <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-light)' }}>{size}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Fixed pixel sizes — never scales with font-size.' } },
  },
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
      <Icon icon={IconAlertCircle} className="text-[color:var(--helix-color-icon-neutral)]" />
      <Icon icon={IconAlertCircle} className="text-[color:var(--helix-color-icon-primary)]" />
      <Icon icon={IconAlertCircle} className="text-[color:var(--helix-color-icon-danger)]" />
      <Icon icon={IconAlertCircle} className="text-[color:var(--helix-color-icon-success)]" />
      <Icon icon={IconAlertCircle} className="text-[color:var(--helix-color-icon-warning)]" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Color always comes from a --helix-color-icon-* token, set explicitly — never inherited from a text/* token.' } },
  },
};

export const InlineWithText: Story = {
  render: () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-25)', fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)' }}>
      <Icon icon={IconArrowRight} size={16} />
      Continue
    </span>
  ),
  parameters: {
    docs: { description: { story: 'Default usage: decorative (aria-hidden), paired with visible text that already conveys the meaning.' } },
  },
};
