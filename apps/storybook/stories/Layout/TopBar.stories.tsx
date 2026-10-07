import type { Meta, StoryObj } from '@storybook/react';
import { IconSearch, IconBell, IconHelp } from '@tabler/icons-react';
import { TopBar, TopBarDoc, Input, IconButton } from '@helix/react';
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
      start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" />}
      end={
        <>
          <IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />
          <IconButton variant="ghost" size="m" icon={IconHelp} label="Help" />
        </>
      }
    />
  ),
};
