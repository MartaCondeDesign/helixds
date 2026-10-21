import type { Meta, StoryObj } from '@storybook/react';
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconSearch,
  IconArrowRight,
} from '@tabler/icons-react';
import { Icon, IconDoc, createIconAdapter } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';
import { mapped } from '../_shared/mapped-arg';

// Stand-in for a foreign icon set whose prop dialect differs from Tabler's — `strokeWidth`
// instead of `stroke`, no `color` prop at all (relies on `currentColor` via className/style
// like most outline sets do). Demonstrates createIconAdapter (ADR-014) without adding a real
// third-party icon dependency just for this one story.
const ForeignSetHeart = ({ size, strokeWidth, className }: { size?: number; strokeWidth?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z" />
  </svg>
);

const AdaptedHeart = createIconAdapter(ForeignSetHeart, { strokeProp: 'strokeWidth' });

const meta: Meta<typeof Icon> = {
  title:     'Components/Icon',
  component:  Icon,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(IconDoc),
  args: { icon: mapped('Plus'), size: 16, decorative: true },
  argTypes: {
    // icon takes the icon component itself — the control picks one by name
    icon: {
      control: 'select',
      options: ['Plus', 'Trash', 'AlertCircle', 'Search', 'ArrowRight'],
      mapping: { Plus: IconPlus, Trash: IconTrash, AlertCircle: IconAlertCircle, Search: IconSearch, ArrowRight: IconArrowRight },
    },
    size: {
      control: 'select',
      options: [12, 14, 16, 18, 20, 24, 28, 32, 36, 40],
    },
    stroke: { control: 'number' },
    decorative: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = { args: { icon: mapped('Plus') } };

export const IconOnly: Story = {
  args: { icon: mapped('Trash'), decorative: false, label: 'Delete' },
  parameters: {
    docs: { description: { story: 'decorative=false with a label renders role="img" aria-label instead of aria-hidden — required whenever the icon is the only content, with no adjacent visible text.' } },
  },
};

export const Sizes: Story = {
  args: { icon: mapped('Search') },
  // The story fixes size (every step of the scale) — icon, decorative and label apply to all of them
  argTypes: { size: { control: false } },
  render: ({ size: _size, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
      {([12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const).map(size => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--helix-primitive-spacing-25)' }}>
          <Icon {...args} size={size} />
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
  args: { icon: mapped('AlertCircle') },
  // The story fixes each icon's color token — icon, size, decorative and label apply to all five
  argTypes: { color: { control: false }, className: { control: false } },
  render: ({ color: _color, className: _className, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
      <Icon {...args} className="text-[color:var(--helix-color-icon-neutral)]" />
      <Icon {...args} className="text-[color:var(--helix-color-icon-primary)]" />
      <Icon {...args} className="text-[color:var(--helix-color-icon-danger)]" />
      <Icon {...args} className="text-[color:var(--helix-color-icon-success)]" />
      <Icon {...args} className="text-[color:var(--helix-color-icon-warning)]" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Color always comes from a --helix-color-icon-* token, set explicitly — never inherited from a text/* token.' } },
  },
};

export const CustomIconSet: Story = {
  args: { size: 24 },
  // The story fixes the icon (the adapted foreign set) and each one's color — size applies to both. The
  // foreign set only takes size / strokeWidth / className, so decorative and label have nothing to reach.
  argTypes: {
    icon: { control: false }, color: { control: false }, className: { control: false },
    decorative: { control: false }, label: { control: false },
  },
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
      <Icon icon={AdaptedHeart} size={size} className="text-[color:var(--helix-color-icon-danger)]" />
      <Icon icon={AdaptedHeart} size={size} className="text-[color:var(--helix-color-icon-neutral)]" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Icon is icon-set-agnostic (ADR-014) — Tabler is the default, not a requirement. A foreign icon set whose props don\'t match Tabler\'s dialect (here, strokeWidth instead of stroke) is wrapped once with createIconAdapter, then passed to icon/iconEnd like any Tabler icon.' } },
  },
};

export const InlineWithText: Story = {
  args: { icon: mapped('ArrowRight') },
  render: (args) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-25)', fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)' }}>
      <Icon {...args} />
      Continue
    </span>
  ),
  parameters: {
    docs: { description: { story: 'Default usage: decorative (aria-hidden), paired with visible text that already conveys the meaning.' } },
  },
};
