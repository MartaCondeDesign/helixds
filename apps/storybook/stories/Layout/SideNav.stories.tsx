import type { Meta, StoryObj } from '@storybook/react';
import {
  IconLayoutDashboard, IconComponents, IconPalette, IconUsers, IconCode, IconSettings, IconBolt,
} from '@tabler/icons-react';
import { SideNav, SideNavDoc, NavItem, Avatar, Icon } from '@helix/react';
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
        {NAV_ITEMS.map(item => (
          <NavItem key={item.label} {...item} />
        ))}
      </SideNav>
    </div>
  ),
};
