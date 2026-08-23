import type { Meta, StoryObj } from '@storybook/react';
import { IconSearch, IconBell, IconHelp } from '@tabler/icons-react';
import { TopBar, TopBarDoc, Input, Button, Avatar } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof TopBar> = {
  title:     'Layout/TopBar',
  component:  TopBar,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(TopBarDoc),
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  render: () => (
    <TopBar
      start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" size="s" />}
      end={
        <>
          <Button variant="ghost" size="s" icon={IconBell} aria-label="Notifications" />
          <Button variant="ghost" size="s" icon={IconHelp} aria-label="Help" />
          <Avatar label="Marta Conde" variant="solid" size="s" />
        </>
      }
    />
  ),
};
