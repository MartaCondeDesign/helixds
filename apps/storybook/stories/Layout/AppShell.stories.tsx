import type { Meta, StoryObj } from '@storybook/react';
import { IconLayoutDashboard, IconUsers, IconSettings, IconSearch, IconBell, IconBolt } from '@tabler/icons-react';
import {
  AppShell, AppShellDoc, SideNav, TopBar, NavItem, Avatar, Input, IconButton, PageHeader, Icon,
} from '@helixds/react';
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
          <SideNav
            brand={
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)' }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 'var(--helix-radius-m)',
                  background: 'var(--helix-color-fill-primary-interactive-light-default)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon icon={IconBolt} size={16} color="var(--helix-color-icon-primary)" />
                </span>
                <strong style={{ fontSize: 'var(--helix-primitive-fontSize-m)', color: 'var(--helix-color-text-neutral)' }}>
                  Helix DS
                </strong>
              </div>
            }
            footer={
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)' }}>
                <Avatar label="Marta Conde" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--helix-textStyle-body-s-medium-fontSize)',
                    fontWeight: 'var(--helix-textStyle-body-s-medium-fontWeight)',
                    color: 'var(--helix-color-text-neutral)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    Marta Conde
                  </div>
                  <div style={{
                    fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)',
                    fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
                    color: 'var(--helix-color-text-neutral-lightest)',
                  }}>
                    Admin
                  </div>
                </div>
              </div>
            }
          >
            <NavItem label="Dashboard" href="#" icon={IconLayoutDashboard} />
            <NavItem label="Team" href="#" icon={IconUsers} current />
            <NavItem label="Settings" href="#" icon={IconSettings} />
          </SideNav>
        }
        topbar={
          <TopBar
            start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" />}
            end={<IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />}
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
