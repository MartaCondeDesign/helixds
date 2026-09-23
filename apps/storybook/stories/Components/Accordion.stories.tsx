import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionDoc } from '@helix-ds/core';
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
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-s)', maxWidth: 420 }}>
      <Accordion label="Shipping">Orders ship within 3-5 business days.</Accordion>
      <Accordion label="Returns" defaultExpanded>Free returns within 30 days of delivery.</Accordion>
      <Accordion label="Warranty">Covered for 2 years against manufacturing defects.</Accordion>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Several independent Accordions stacked — each opens/closes on its own, no exclusive-open group behavior.' } },
  },
};
