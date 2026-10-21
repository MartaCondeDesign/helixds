import type { Meta, StoryObj } from '@storybook/react';
import { IconSearch, IconBell, IconHelp } from '@tabler/icons-react';
import { TopBar, TopBarDoc, Input, IconButton } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';
import { mapped } from '../_shared/mapped-arg';

const SEARCH = <Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" />;
const ACTIONS = (
  <>
    <IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />
    <IconButton variant="ghost" size="m" icon={IconHelp} label="Help" />
  </>
);

const meta: Meta<typeof TopBar> = {
  title:     'Layout/TopBar',
  component:  TopBar,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(TopBarDoc),
  // start / end are slots — each control picks what fills it, or leaves it empty
  argTypes: {
    start: { control: 'select', options: ['Search', 'none'], mapping: { Search: SEARCH, none: undefined } },
    end:   { control: 'select', options: ['Actions', 'none'], mapping: { Actions: ACTIONS, none: undefined } },
  },
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: { start: mapped('Search'), end: mapped('Actions') },
};
