import type { Meta, StoryObj } from '@storybook/react';
import {
  IconLayoutDashboard, IconComponents, IconPalette, IconUsers, IconCode, IconSettings, IconBolt,
} from '@tabler/icons-react';
import { SideNav, SideNavDoc, NavItem, Avatar, Icon } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof SideNav> = {
  title:     'Layout/SideNav',
  component:  SideNav,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SideNavDoc),
};

export default meta;
type Story = StoryObj<typeof SideNav>;

const NAV_ITEMS = [
  { icon: IconLayoutDashboard, label: 'Dashboard',  href: '#' },
  { icon: IconComponents,      label: 'Components', href: '#' },
  { icon: IconPalette,         label: 'Tokens',      href: '#' },
  { icon: IconUsers,           label: 'Team',        href: '#', current: true },
  { icon: IconCode,            label: 'AI Context',  href: '#' },
  { icon: IconSettings,        label: 'Settings',    href: '#' },
];

export const Default: Story = {
  render: () => (
    <div style={{ height: 480, display: 'flex' }}>
      <SideNav
        brand={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)' }}>
            <span style={{
              width: 28, height: 28, borderRadius: 'var(--helix-radius-m)',
              background: 'var(--helix-color-fill-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon icon={IconBolt} size={16} stroke={2.5} color="var(--helix-color-text-inverse)" />
            </span>
            <strong style={{ fontSize: 'var(--helix-primitive-fontSize-m)', color: 'var(--helix-color-text-neutral)' }}>
              Helix DS
            </strong>
          </div>
        }
        footer={<Avatar label="Marta Conde" variant="solid" />}
      >
        {NAV_ITEMS.map(item => (
          <NavItem key={item.label} {...item} />
        ))}
      </SideNav>
    </div>
  ),
};
