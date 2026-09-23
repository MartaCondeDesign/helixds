import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SidePanel, SidePanelDoc, Button } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof SidePanel> = {
  title:     'Components/SidePanel',
  component:  SidePanel,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SidePanelDoc),
  args: {
    label: 'Edit filters',
    children: 'Filter builder content goes here.',
  },
};

export default meta;
type Story = StoryObj<typeof SidePanel>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onPress={() => setOpen(true)}>Open SidePanel</Button>
        <SidePanel {...args} expanded={open} onDismiss={() => setOpen(false)} />
      </>
    );
  },
};

export const BottomPlacement: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onPress={() => setOpen(true)}>Open SidePanel</Button>
        <SidePanel {...args} expanded={open} onDismiss={() => setOpen(false)} placement="bottom" />
      </>
    );
  },
  parameters: {
    docs: { description: { story: "placement=\"bottom\" — full width, slides up from the bottom edge instead of in from the right." } },
  },
};
