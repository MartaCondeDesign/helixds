import type { Meta, StoryObj } from '@storybook/react';
import { IconLayoutDashboard, IconUsers, IconSettings, IconSearch, IconBell } from '@tabler/icons-react';
import {
  AppShell, AppShellDoc, SideNav, TopBar, NavItem, Avatar, Input, Button, PageHeader,
} from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof AppShell> = {
  title:     'Layout/AppShell',
  component:  AppShell,
  tags:      ['autodocs'],
  parameters: { ...createComponentDocsParameters(AppShellDoc), layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

export const Default: Story = {
  render: () => (
    <div style={{ height: '100vh' }}>
      <AppShell
        sidenav={
          <SideNav footer={<Avatar label="Marta Conde" variant="solid" />}>
            <NavItem label="Dashboard" href="#" icon={IconLayoutDashboard} />
            <NavItem label="Team" href="#" icon={IconUsers} current />
            <NavItem label="Settings" href="#" icon={IconSettings} />
          </SideNav>
        }
        topbar={
          <TopBar
            start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" size="s" />}
            end={<Button variant="ghost" size="s" icon={IconBell} aria-label="Notifications" />}
          />
        }
      >
        <PageHeader label="Team" description="Manage members and their access to the Helix workspace." />
      </AppShell>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'The full page shell — SideNav + TopBar + scrollable main content, no hand-rolled display:flex anywhere.' } },
  },
};
