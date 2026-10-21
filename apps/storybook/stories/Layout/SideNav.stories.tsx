import type { Meta, StoryObj } from '@storybook/react';
import {
  IconLayoutDashboard, IconComponents, IconPalette, IconUsers, IconCode, IconSettings, IconBolt,
} from '@tabler/icons-react';
import { SideNav, SideNavDoc, NavItem, Avatar, Icon } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';
import { mapped } from '../_shared/mapped-arg';

const NAV_ITEMS = [
  { icon: IconLayoutDashboard, label: 'Dashboard',  href: '#' },
  { icon: IconComponents,      label: 'Components', href: '#' },
  { icon: IconPalette,         label: 'Tokens',      href: '#' },
  { icon: IconUsers,           label: 'Team',        href: '#', current: true },
  { icon: IconCode,            label: 'AI Context',  href: '#' },
  { icon: IconSettings,        label: 'Settings',    href: '#' },
];

const BRAND = (
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
);

const FOOTER = (
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
);

const NAV = NAV_ITEMS.map(item => <NavItem key={item.label} {...item} />);

const meta: Meta<typeof SideNav> = {
  title:     'Layout/SideNav',
  component:  SideNav,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SideNavDoc),
  // brand / footer are slots — each control picks what fills it, or leaves it empty
  argTypes: {
    brand:    { control: 'select', options: ['Logo', 'none'], mapping: { Logo: BRAND, none: undefined } },
    footer:   { control: 'select', options: ['User', 'none'], mapping: { User: FOOTER, none: undefined } },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof SideNav>;

export const Default: Story = {
  args: { brand: mapped('Logo'), footer: mapped('User'), children: NAV },
  render: ({ brand, footer, children, className }) => (
    <div style={{ height: 480, display: 'flex' }}>
      <SideNav brand={brand} footer={footer} className={className}>{children}</SideNav>
    </div>
  ),
};
