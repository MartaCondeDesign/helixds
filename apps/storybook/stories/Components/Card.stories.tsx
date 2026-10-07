import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardDoc } from '@helixds/react';
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
    children: 'Card is a flat, bordered container for grouping related content. It has no shadow by design — Helix reserves elevation for surfaces that float above the page, like Modal and Tooltip. Use it to group a form section, a settings block, or a summary of related fields.',
    padding: 'default',
    showHeader: true,
    headerText: 'Card title',
  },
  argTypes: {
    showHeader: { control: 'boolean', description: 'Toggle to see the header + divider (not a real CardProps field — local to this story).' },
    headerText: { control: 'text', description: 'Header text, only shown when showHeader is on.' },
  },
  render: (args: { children: string; padding: 'default' | 'none'; className?: string; showHeader: boolean; headerText: string }) => (
    // Wider than tall — a horizontal rectangle instead of the narrow CardGrid cell, so the header
    // and body text each read on a couple of lines rather than a long single narrow column.
    <div style={{ width: '340px' }}>
      <Card
        padding={args.padding}
        className={args.className}
        // No inline font styling needed — card-header itself now carries heading-l-bold
        // (fontFamily/fontSize/fontWeight/lineHeight) plus its own color, straight from tokens.
        header={args.showHeader ? args.headerText : undefined}
      >
        {args.children}
      </Card>
    </div>
  ),
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
          <div style={{
            fontFamily: 'var(--helix-textStyle-caption-semibold-fontFamily)',
            fontSize: 'var(--helix-textStyle-caption-semibold-fontSize)',
            fontWeight: 'var(--helix-textStyle-caption-semibold-fontWeight)',
            lineHeight: 'var(--helix-textStyle-caption-semibold-lineHeight)',
            color: 'var(--helix-color-text-neutral-lightest)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--helix-primitive-letterSpacing-wide)',
            marginBottom: 'var(--helix-primitive-spacing-50)',
          }}>
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
