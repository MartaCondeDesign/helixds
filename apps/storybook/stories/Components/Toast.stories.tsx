import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Toast, ToastDoc, Button, toast } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Toast> = {
  title:     'Components/Toast',
  component:  Toast,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(ToastDoc),
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  // What each toast says is the call (fixed per button); <Toast /> itself only takes className
  render: ({ className }) => (
    <>
      <div style={{ display: 'flex', gap: 'var(--helix-spacing-s)', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => toast.neutral('Draft saved', 'Your changes were saved automatically.')}>Neutral</Button>
        <Button variant="secondary" onClick={() => toast.info('Update available', 'A new version is ready — refresh to update.')}>Info</Button>
        <Button variant="secondary" onClick={() => toast.success('Published', 'Your changes are now live.')}>Success</Button>
        <Button variant="secondary" onClick={() => toast.warning('Session expiring', 'You’ll be signed out in 5 minutes.')}>Warning</Button>
        <Button variant="secondary" onClick={() => toast.danger('Connection lost', 'Could not reach the server — check your network.')}>Danger</Button>
      </div>
      <Toast className={className} />
    </>
  ),
  parameters: {
    docs: { description: { story: 'Fire a few in a row to see the stack (newest on top, older ones peek behind). Hover the stack to spread them apart and read the older ones — the stack expands downward, since it\'s pinned to the top of the screen. Each auto-dismisses after 4s unless hovered.' } },
  },
};

// Toast itself only mounts the stack (<Toast />); what a toast shows is the call: toast[variant](label,
// description). These controls are that call's arguments — the same three properties the Figma component has.
type PlaygroundArgs = { variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger'; label: string; description: string };
export const Playground: StoryObj<PlaygroundArgs> = {
  args: { variant: 'success', label: 'Published', description: 'Your changes are now live.' },
  argTypes: {
    variant:     { control: 'select', options: ['neutral', 'info', 'success', 'warning', 'danger'], description: 'Which call: toast.neutral / info / success / warning / danger' },
    label:       { control: 'text', description: 'First argument — the title' },
    description: { control: 'text', description: 'Second argument — optional supporting line' },
  },
  render: ({ variant, label, description }) => (
    <>
      <Button variant="secondary" onClick={() => toast[variant](label, description || undefined)}>Show toast</Button>
      <Toast />
    </>
  ),
  parameters: {
    controlsCheck: { reason: 'the args reach the toast the button opens, not the canvas' },
    docs: { description: { story: 'Change the controls, then press the button: it calls `toast[variant](label, description)` with them.' } },
  },
};

// controls-off: the play test opens two toasts and checks the keyboard reaches them — an overlay test, nothing to set
export const KeyboardReach: Story = {
  render: () => (
    <>
      <Button variant="secondary" onClick={() => toast.success('Published', 'Your changes are now live.')}>Show toast</Button>
      <Toast />
    </>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Show toast' });
    toast.success('Published', 'Your changes are now live.');
    toast.info('Update available', { description: 'A new version is ready — refresh to update.' }); // Sonner-style form
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(2));
    const [first, second] = page.getAllByRole('button', { name: 'Dismiss' });
    await expect(page.getByText('A new version is ready — refresh to update.')).toBeInTheDocument();

    // Tab reaches each visible toast's close button, in order
    trigger.focus();
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.tab();
    await expect(second).toHaveFocus();

    // Focus inside keeps them: the stack spreads (like hover) and auto-dismiss (4s) is stopped
    const viewport = canvasElement.ownerDocument.querySelector('[data-helix-part="toast-viewport"]')!;
    await waitFor(() => expect(viewport).toHaveAttribute('data-spread', 'true'));
    await new Promise(r => setTimeout(r, 4500));
    await expect(page.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(2);
  },
  parameters: {
    controls: { disable: true },
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab reaches each visible toast’s close button; with focus inside, the stack spreads and the toasts stay past the 4s auto-dismiss.' } },
  },
};

function NoAutoDismiss() {
  // Long enough for the browser checks to finish before the toast leaves; restored on unmount.
  useEffect(() => {
    document.documentElement.style.setProperty('--helix-toast-autoDismissMs', '600000');
    return () => { document.documentElement.style.removeProperty('--helix-toast-autoDismissMs'); };
  }, []);
  return null;
}

// controls-off: an open overlay, kept on screen only for the browser checks
export const Opened: Story = {
  // Not in the docs page (an open overlay would cover it) — this story exists so the browser checks
  // (axe, contrast, visible focus, target size, what a screen reader hears) run on the OPEN state, which no
  // other story leaves on screen: their play tests open and close it again.
  tags: ['!autodocs'],
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <NoAutoDismiss />
      <Button variant="secondary" onClick={() => { toast.success('Published', 'Your changes are now live.'); toast.danger('Connection lost', 'Could not reach the server.'); }}>Show toasts</Button>
      <Toast />
    </>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Show toasts' }));
    // The stack is portaled to <body>
    await waitFor(() => expect(within(document.body).getByText('Connection lost')).toBeVisible());
  },
};
