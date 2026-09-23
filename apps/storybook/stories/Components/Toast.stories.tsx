import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastDoc, Button, toast } from '@helix-ds/core';
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
  render: () => (
    <>
      <div style={{ display: 'flex', gap: 'var(--helix-spacing-s)', flexWrap: 'wrap' }}>
        <Button variant="secondary" onPress={() => toast.neutral('Draft saved', 'Your changes were saved automatically.')}>Neutral</Button>
        <Button variant="secondary" onPress={() => toast.info('Update available', 'A new version is ready — refresh to update.')}>Info</Button>
        <Button variant="secondary" onPress={() => toast.success('Published', 'Your changes are now live.')}>Success</Button>
        <Button variant="secondary" onPress={() => toast.warning('Session expiring', 'You’ll be signed out in 5 minutes.')}>Warning</Button>
        <Button variant="secondary" onPress={() => toast.danger('Connection lost', 'Could not reach the server — check your network.')}>Danger</Button>
      </div>
      <Toast />
    </>
  ),
  parameters: {
    docs: { description: { story: 'Fire a few in a row to see the stack (newest on top, older ones peek behind). Hover the stack to spread them apart and read the older ones — the stack expands downward, since it\'s pinned to the top of the screen. Each auto-dismisses after 4s unless hovered.' } },
  },
};
