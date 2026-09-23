import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalDoc, Button } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Modal> = {
  title:     'Components/Modal',
  component:  Modal,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(ModalDoc),
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
        <Button variant="primary" onPress={() => setOpen(true)}>Open Modal</Button>
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
  args: {
    label: 'Delete project',
    children: "This can't be undone. The project and all its data will be permanently removed.",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onPress={() => setOpen(true)}>Open Modal</Button>
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
  args: {
    label: 'Delete project',
    children: "This can't be undone. The project and all its data will be permanently removed.",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onPress={() => setOpen(true)}>Open Modal</Button>
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
  args: {
    label: 'Confirm subscription',
    children: 'Choose an option below to continue — this dialog has no close (X) button, so a footer action is required.',
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onPress={() => setOpen(true)}>Open Modal</Button>
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
