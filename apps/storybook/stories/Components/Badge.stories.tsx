import type { Meta, StoryObj } from '@storybook/react';
import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconInfoCircle,
  IconClock,
} from '@tabler/icons-react';
import { Badge, BadgeDoc } from '@helix-ds/core';
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
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Neutral: Story  = { args: { variant: 'neutral', label: 'Draft' } };
export const Info: Story     = { args: { variant: 'info',    label: 'Scheduled' } };
export const Success: Story  = { args: { variant: 'success', label: 'Active' } };
export const Warning: Story  = { args: { variant: 'warning', label: 'Pending' } };
export const Danger: Story   = { args: { variant: 'danger',  label: 'Failed' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge variant="neutral" label="Draft" />
      <Badge variant="info"    label="Scheduled" />
      <Badge variant="success" label="Active" />
      <Badge variant="warning" label="Pending" />
      <Badge variant="danger"  label="Failed" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'All variants. Each must communicate its meaning through the label text, not color alone.' },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge variant="success" icon={<IconCheck size={10} />}         label="Verified" />
      <Badge variant="warning" icon={<IconAlertTriangle size={10} />} label="Review" />
      <Badge variant="danger"  icon={<IconX size={10} />}             label="Rejected" />
      <Badge variant="info"    icon={<IconClock size={10} />}         label="Queued" />
      <Badge variant="neutral" icon={<IconInfoCircle size={10} />}    label="Unknown" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Leading icon at 10px. Icon is `aria-hidden` — label still required.' } },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-light)', marginBottom: '8px' }}>
          size=&quot;xs&quot;
        </p>
        <Badge size="xs" variant="success" label="Active" />
      </div>
      <div>
        <p style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-light)', marginBottom: '8px' }}>
          size=&quot;s&quot; (default)
        </p>
        <Badge size="s" variant="success" label="Active" />
      </div>
    </div>
  ),
};

export const StatusRowPattern: Story = {
  render: () => {
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
      <div style={{
        border:       '1px solid var(--helix-color-border-neutral)',
        borderRadius: 'var(--helix-radius-l)',
        overflow:     'hidden',
        maxWidth:     '480px',
      }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--helix-primitive-spacing-75)',
              padding:      'var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)',
              borderBottom: i < rows.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
            }}
          >
            <span style={{ flex: 1, fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)', fontWeight: 'var(--helix-primitive-fontWeight-medium)' }}>
              {row.label}
            </span>
            <Badge variant={row.status} label={config[row.status].label} />
            <span style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-lightest)', minWidth: '52px', textAlign: 'right' }}>
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
