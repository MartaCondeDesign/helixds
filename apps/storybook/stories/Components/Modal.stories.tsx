import { useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalDoc, Button } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Modal> = {
  title:     'Components/Modal',
  component:  Modal,
  tags:      ['autodocs'],
  parameters: {
    ...createComponentDocsParameters(ModalDoc),
    // closeOnBackdropClick changes what a backdrop click does, nothing the canvas shows
    controlsCheck: { skip: ['closeOnBackdropClick'], reason: 'it changes what a backdrop click does, not what shows' },
  },
  // every story holds the open state and sets its own primary action
  argTypes: { expanded: { control: false }, primaryActionLabel: { control: false } },
  args: {
    label: 'Project settings',
    children: 'Modal content goes here — centered on screen, with a backdrop and focus trapped inside until dismissed.',
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  // Modal always carries at least one bottom-right action in real usage — the default demo reflects
  // that instead of showing a footer-less modal as the baseline case.
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          {...args}
          expanded={open}
          onDismiss={() => setOpen(false)}
          primaryActionLabel="Save"
          onPrimaryAction={() => setOpen(false)}
        />
      </>
    );
  },
};

export const WithFooterActions: Story = {
  argTypes: { secondaryActionLabel: { control: false } }, // the story sets these actions itself
  args: {
    label: 'Delete project',
    children: "This can't be undone. The project and all its data will be permanently removed.",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          {...args}
          expanded={open}
          onDismiss={() => setOpen(false)}
          primaryActionLabel="Delete"
          onPrimaryAction={() => setOpen(false)}
          secondaryActionLabel="Cancel"
          onSecondaryAction={() => setOpen(false)}
        />
      </>
    );
  },
};

export const WithTertiaryAction: Story = {
  argTypes: { secondaryActionLabel: { control: false }, tertiaryActionLabel: { control: false } }, // the story sets these actions itself
  args: {
    label: 'Delete project',
    children: "This can't be undone. The project and all its data will be permanently removed.",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          {...args}
          expanded={open}
          onDismiss={() => setOpen(false)}
          tertiaryActionLabel="Learn more"
          onTertiaryAction={() => {}}
          primaryActionLabel="Delete"
          onPrimaryAction={() => setOpen(false)}
          secondaryActionLabel="Cancel"
          onSecondaryAction={() => setOpen(false)}
        />
      </>
    );
  },
  parameters: {
    docs: { description: { story: 'A third action pinned to the bottom-left corner, separate from the primary/secondary pair.' } },
  },
};

export const WithoutCloseButton: Story = {
  argTypes: { secondaryActionLabel: { control: false }, showCloseButton: { control: false } }, // the story sets these actions itself
  args: {
    label: 'Confirm subscription',
    children: 'Choose an option below to continue — this dialog has no close (X) button, so a footer action is required.',
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          {...args}
          expanded={open}
          onDismiss={() => setOpen(false)}
          showCloseButton={false}
          primaryActionLabel="Confirm"
          onPrimaryAction={() => setOpen(false)}
          secondaryActionLabel="Cancel"
          onSecondaryAction={() => setOpen(false)}
        />
      </>
    );
  },
  parameters: {
    docs: { description: { story: 'showCloseButton={false} always pairs with at least one footer action — otherwise Modal logs a dev warning, since there would be no on-screen way to dismiss it.' } },
  },
};

export const KeyboardDismiss: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          {...args}
          expanded={open}
          onDismiss={() => setOpen(false)}
          primaryActionLabel="Save"
          onPrimaryAction={() => setOpen(false)}
        >
          <Button variant="secondary">Inside action</Button>
        </Modal>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'Open Modal' });
    await userEvent.click(opener);
    const dialog = await canvas.findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
    const controls = within(dialog).getAllByRole('button');

    // Tab moves focus between the modal's own controls — the page behind is inert while it's open
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
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab moves between the modal’s controls, Escape dismisses it, and focus returns to the button that opened it.' } },
  },
};

export const Opened: Story = {
  // Not in the docs page (an open overlay would cover it) — this story exists so the browser checks
  // (axe, contrast, visible focus, target size, what a screen reader hears) run on the OPEN state, which no
  // other story leaves on screen: their play tests open and close it again.
  tags: ['!autodocs'],
  render: Default.render,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open Modal' }));
    const dialog = await within(canvasElement).findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
  },
};
