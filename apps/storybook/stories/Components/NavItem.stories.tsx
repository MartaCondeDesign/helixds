import type { Meta, StoryObj } from '@storybook/react';
import { IconLayoutDashboard, IconUsers, IconSettings } from '@tabler/icons-react';
import { NavItem, NavItemDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof NavItem> = {
  title:     'Components/NavItem',
  component:  NavItem,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(NavItemDoc),
  args: { label: 'Dashboard', href: '#', icon: IconLayoutDashboard, current: false },
  argTypes: {
    icon:  { control: false },
    label: { control: 'text' },
    href:  { control: 'text' },
    current: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Default: Story = { args: {} };

export const Current: Story = { args: { current: true } };

export const NavList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, width: 200 }}>
      <NavItem label="Dashboard" href="#" icon={IconLayoutDashboard} />
      <NavItem label="Team" href="#" icon={IconUsers} current />
      <NavItem label="Settings" href="#" icon={IconSettings} />
    </div>
  ),
};
