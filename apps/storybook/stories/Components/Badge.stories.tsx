import type { Meta, StoryObj } from '@storybook/react';
import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconInfoCircle,
  IconClock,
} from '@tabler/icons-react';
import { Badge, BadgeDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Badge> = {
  title:     'Components/Badge',
  component:  Badge,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(BadgeDoc),
  args: { variant: 'neutral', size: 's' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['xs', 's'],
    },
    label: { control: 'text' },
    // icon takes the Tabler component itself — the control picks one by name
    icon: {
      control: 'select',
      options: ['none', 'Check', 'AlertTriangle', 'X', 'InfoCircle', 'Clock'],
      mapping: { none: undefined, Check: IconCheck, AlertTriangle: IconAlertTriangle, X: IconX, InfoCircle: IconInfoCircle, Clock: IconClock },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const AllVariants: Story = {
  argTypes: { variant: { control: false }, label: { control: false } },
  render: ({ size, icon }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge size={size} icon={icon} variant="neutral" label="Draft" />
      <Badge size={size} icon={icon} variant="info" label="Scheduled" />
      <Badge size={size} icon={icon} variant="success" label="Active" />
      <Badge size={size} icon={icon} variant="warning" label="Pending" />
      <Badge size={size} icon={icon} variant="danger" label="Failed" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'All variants — size and icon apply to every badge. Each must communicate its meaning through the label text, not color alone.' },
    },
  },
};

export const WithIcons: Story = {
  argTypes: { variant: { control: false }, label: { control: false }, icon: { control: false } },
  render: ({ size }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge size={size} variant="success" icon={IconCheck}         label="Verified" />
      <Badge size={size} variant="warning" icon={IconAlertTriangle} label="Review" />
      <Badge size={size} variant="danger"  icon={IconX}             label="Rejected" />
      <Badge size={size} variant="info"    icon={IconClock}         label="Queued" />
      <Badge size={size} variant="neutral" icon={IconInfoCircle}    label="Unknown" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Leading icon at 10px — size applies to every badge. Icon is `aria-hidden` — label still required.' } },
  },
};

export const Sizes: Story = {
  args: { variant: 'success', label: 'Active' },
  argTypes: { size: { control: false } },
  render: ({ variant, label, icon }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
      <Badge size="xs" variant={variant} label={label} icon={icon} />
      <Badge size="s" variant={variant} label={label} icon={icon} />
    </div>
  ),
};

export const StatusRowPattern: Story = {
  argTypes: { variant: { control: false }, label: { control: false }, icon: { control: false } },
  render: ({ size }) => {
    const rows = [
      { label: 'Deploy to production', status: 'success' as const, meta: '2m ago' },
      { label: 'Run test suite',        status: 'warning' as const, meta: '5m ago' },
      { label: 'Build Docker image',    status: 'neutral' as const, meta: '12m ago' },
      { label: 'Code review',           status: 'danger'  as const, meta: '1h ago' },
      { label: 'Security scan',         status: 'info'    as const, meta: 'Queued' },
    ] as const;

    const config: Record<typeof rows[number]['status'], { label: string }> = {
      success: { label: 'Success' },
      warning: { label: 'Warning' },
      neutral: { label: 'Neutral' },
      danger:  { label: 'Failed' },
      info:    { label: 'Scheduled' },
    };

    return (
      // Rows share the container's columns (subgrid), so every badge sits in the same column, left-aligned —
      // per-row flex left each badge wherever its own label's width happened to end.
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr auto auto',
        columnGap:           'var(--helix-primitive-spacing-75)',
        border:              '1px solid var(--helix-color-border-neutral)',
        borderRadius:        'var(--helix-radius-l)',
        overflow:            'hidden',
        maxWidth:            '480px',
      }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display:             'grid',
              gridColumn:          '1 / -1',
              gridTemplateColumns: 'subgrid',
              alignItems:          'center',
              justifyItems:        'start',
              padding:             'var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)',
              borderBottom: i < rows.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
            }}
          >
            <span style={{ flex: 1, fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)', fontWeight: 'var(--helix-primitive-fontWeight-medium)' }}>
              {row.label}
            </span>
            <Badge size={size} variant={row.status} label={config[row.status].label} />
            <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-lightest)', justifySelf: 'end', textAlign: 'right' }}>
              {row.meta}
            </span>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Status row pattern. Badge communicates status in both color and text.',
      },
    },
  },
};
