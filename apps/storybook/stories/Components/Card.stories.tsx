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
    header:    { control: false },
    children:  { control: 'text' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// The Default story is the interactive playground — every other story below uses a fixed
// render() with hardcoded content, so their Controls panel shows fields that don't do anything
// (a real point of confusion: editing `children` there changes nothing because that story
// never reads args.children). `showHeader`/`headerText` aren't real CardProps — they're local
// to this story only, so you can discover "Card can have a header/divider" and toggle it live
// without needing arbitrary-JSX editing in Controls (header itself stays control:false — it's
// ReactNode, not something a text field can produce).
export const Default = {
  args: {
    children: 'Card body content.',
    padding: 'default',
    showHeader: false,
    headerText: 'Card title',
  },
  argTypes: {
    showHeader: { control: 'boolean', description: 'Toggle to see the header + divider (not a real CardProps field — local to this story).' },
    headerText: { control: 'text', description: 'Header text, only shown when showHeader is on.' },
  },
  render: (args: { children: string; padding: 'default' | 'none'; className?: string; showHeader: boolean; headerText: string }) => (
    <Card
      padding={args.padding}
      className={args.className}
      header={args.showHeader ? <strong style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)' }}>{args.headerText}</strong> : undefined}
    >
      {args.children}
    </Card>
  ),
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
    docs: { description: { story: 'Fixed example — this story\'s content is hardcoded, so Controls won\'t change it. header renders above the body with a divider — commonly a title plus trailing actions or a status badge. Use the Default story to try the header/divider live.' } },
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
    docs: { description: { story: "Fixed example — this story's content is hardcoded, so Controls won't change it. padding='none' removes Card's own body padding — use when the content inside (a Table, a List) needs to reach the card's edges." } },
  },
};

type GridItem = { label: string; value: string };

// This story's content is a list of {label, value} pairs, not Card's own prop shape — it needs its
// own args type rather than `Story` (= StoryObj<typeof Card>), so it's typed loosely here.
export const CardGrid = {
  args: {
    padding: 'default',
    items: [
      { label: 'Members', value: '6' },
      { label: 'Active', value: '4' },
      { label: 'Components', value: '103' },
    ] satisfies GridItem[],
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of { label, value } — edit here to change the card texts.',
    },
  },
  render: (args: { items: GridItem[]; padding: 'default' | 'none' }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 'var(--helix-primitive-spacing-100)',
    }}>
      {args.items.map(item => (
        <Card key={item.label} padding={args.padding}>
          <div style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-lightest)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--helix-primitive-spacing-50)' }}>
            {item.label}
          </div>
          <div style={{ fontSize: 'var(--helix-primitive-fontSize-3xl)', fontWeight: 'var(--helix-primitive-fontWeight-bold)', color: 'var(--helix-color-text-neutral)' }}>
            {item.value}
          </div>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'A row of Cards used as metric widgets — edit the `items` control to change the texts. See the full recipe (label + value + delta) in Patterns → StatCard, `.ai/maps/patterns/stat-card.md`.' } },
  },
};
