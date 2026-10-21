import { useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { SidePanel, SidePanelDoc, Button } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof SidePanel> = {
  title:     'Components/SidePanel',
  component:  SidePanel,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SidePanelDoc),
  // Figma's order: the props that are Figma variants first, then the rest (each group in code order)
  args: {
    placement: undefined,
    label: 'Edit filters',
    children: 'Filter builder content goes here.',
    expanded: undefined,
    onDismiss: undefined,
    showCloseButton: undefined,
    closeOnBackdropClick: undefined,
  },
};

export default meta;
type Story = StoryObj<typeof SidePanel>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open SidePanel</Button>
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
        <Button variant="primary" onClick={() => setOpen(true)}>Open SidePanel</Button>
        <SidePanel {...args} expanded={open} onDismiss={() => setOpen(false)} placement="bottom" />
      </>
    );
  },
  parameters: {
    docs: { description: { story: "placement=\"bottom\" — full width, slides up from the bottom edge instead of in from the right." } },
  },
};

export const RightPlacement: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open SidePanel</Button>
        <SidePanel {...args} expanded={open} onDismiss={() => setOpen(false)} placement="right" />
      </>
    );
  },
  parameters: {
    docs: { description: { story: 'placement="right" (the default) — full height, slides in from the right edge.' } },
  },
};

export const KeyboardDismiss: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open SidePanel</Button>
        <SidePanel
          {...args}
          expanded={open}
          onDismiss={() => setOpen(false)}
        >
          <Button variant="secondary">Inside action</Button>
        </SidePanel>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'Open SidePanel' });
    await userEvent.click(opener);
    const dialog = await canvas.findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
    const controls = within(dialog).getAllByRole('button');

    // Tab moves focus between the panel's own controls — the page behind is inert while it's open
    controls[0]!.focus();
    await userEvent.tab();
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await expect(document.activeElement).not.toBe(controls[0]);
    await expect(opener).not.toHaveFocus();

    // Escape dismisses it (through onDismiss, with the close animation)
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    // …and focus goes back to the button that opened it (WCAG 2.4.3), not to the top of the page
    await waitFor(() => expect(opener).toHaveFocus());
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab moves between the panel’s controls, Escape dismisses it, and focus returns to the button that opened it.' } },
  },
};

export const Opened: Story = {
  // Not in the docs page (an open overlay would cover it) — this story exists so the browser checks
  // (axe, contrast, visible focus, target size, what a screen reader hears) run on the OPEN state, which no
  // other story leaves on screen: their play tests open and close it again.
  tags: ['!autodocs'],
  render: Default.render,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open SidePanel' }));
    const dialog = await within(canvasElement).findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
  },
};
