import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardDoc, Badge } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Card> = {
  title:     'Components/Card',
  component:  Card,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(CardDoc),
  args: { padding: 'default' },
  argTypes: {
    padding: {
      control: 'select',
      options: ['default', 'none'],
    },
    header:   { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: { children: 'Card body content.' },
};

export const WithHeader: Story = {
  render: () => (
    <Card
      header={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)' }}>
            Team activity
          </strong>
          <Badge variant="success" label="Live" />
        </div>
      }
    >
      Content below the header, separated by a divider.
    </Card>
  ),
  parameters: {
    docs: { description: { story: 'header renders above the body with a divider — commonly a title plus trailing actions or a status badge.' } },
  },
};

export const NoPadding: Story = {
  render: () => (
    <Card padding="none">
      <div style={{ padding: 'var(--helix-primitive-spacing-100)' }}>
        Content that manages its own edge-to-edge spacing (e.g. a Table) sets padding='none' on Card.
      </div>
    </Card>
  ),
  parameters: {
    docs: { description: { story: "padding='none' removes Card's own body padding — use when the content inside (a Table, a List) needs to reach the card's edges." } },
  },
};

export const CardGrid: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', flexWrap: 'wrap' }}>
      {['Members', 'Active', 'Components'].map(label => (
        <Card key={label}>
          <div style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-lightest)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--helix-primitive-spacing-50)' }}>
            {label}
          </div>
          <div style={{ fontSize: 'var(--helix-primitive-fontSize-3xl)', fontWeight: 'var(--helix-primitive-fontWeight-bold)', color: 'var(--helix-color-text-neutral)' }}>
            —
          </div>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'A row of Cards used as widgets — this is what StatCard composes internally.' } },
  },
};
