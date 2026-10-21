import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Accordion, AccordionDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Accordion> = {
  title:     'Components/Accordion',
  component:  Accordion,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(AccordionDoc),
  args: {
    label: 'Shipping details',
    children: 'Orders ship within 3-5 business days. Express shipping is available at checkout.',
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {},
};

export const OpenByDefault: Story = {
  args: { defaultExpanded: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Stack: Story = {
  // The story fixes each Accordion's label, content and open state — disabled applies to all three
  argTypes: {
    label: { control: false }, children: { control: false },
    expanded: { control: false }, defaultExpanded: { control: false },
  },
  render: ({ disabled }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-s)', maxWidth: 420 }}>
      <Accordion disabled={disabled} label="Shipping">Orders ship within 3-5 business days.</Accordion>
      <Accordion disabled={disabled} label="Returns" defaultExpanded>Free returns within 30 days of delivery.</Accordion>
      <Accordion disabled={disabled} label="Warranty">Covered for 2 years against manufacturing defects.</Accordion>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Several independent Accordions stacked — each opens/closes on its own, no exclusive-open group behavior.' } },
  },
};

export const Controlled: Story = {
  argTypes: { expanded: { control: false }, defaultExpanded: { control: false } }, // the story holds the open state
  render: args => {
    const [expanded, setExpanded] = useState(true);
    return (
      <Accordion {...args} expanded={expanded} onExpandedChange={setExpanded}>
        {args.children}
      </Accordion>
    );
  },
  parameters: {
    docs: { description: { story: 'Controlled: `expanded` + `onExpandedChange` hold the open state in the parent — here it starts expanded.' } },
  },
};

export const KeyboardToggle: Story = {
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByText('Shipping details').closest('summary')!;

    // focus() rather than userEvent.tab(): user-event's simulated Tab order doesn't include <summary>
    // (a real browser's does)
    header.focus();
    await expect(header).toHaveFocus();
    await expect(header).toHaveAttribute('aria-expanded', 'false');

    // Enter toggles open
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(header).toHaveAttribute('aria-expanded', 'true'));

    // Space toggles closed
    await userEvent.keyboard('[Space]');
    await waitFor(() => expect(header).toHaveAttribute('aria-expanded', 'false'));
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Enter and Space on the focused header each toggle the panel.' } },
  },
};
