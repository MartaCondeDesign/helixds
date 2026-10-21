import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { IconLayoutDashboard, IconUsers, IconSettings, IconSearch, IconBell, IconBolt } from '@tabler/icons-react';
import {
  AppShell, AppShellDoc, SideNav, TopBar, NavItem, Avatar, Input, IconButton, PageHeader, Icon,
} from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';
import { mapped } from '../_shared/mapped-arg';

const SIDENAV = (
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
);

const TOPBAR = (
  <TopBar
    start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" />}
    end={<IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />}
  />
);

const CONTENT = (
  <PageHeader label="Team" description="Manage members and their access to the Helix workspace." />
);

// Below 768px of its own width the shell collapses the SideNav (a size container, not a media query),
// so a 375px frame shows the phone layout at any viewport.
const PHONE_WIDTH = 375;

const meta: Meta<typeof AppShell> = {
  title:     'Layout/AppShell',
  component:  AppShell,
  tags:      ['autodocs'],
  parameters: { ...createComponentDocsParameters(AppShellDoc), layout: 'fullscreen' },
  // Figma variant first (sidenavExpanded), then the rest — same order as the Figma properties.
  args: {
    sidenavExpanded:         undefined,
    sidenav:                 mapped('SideNav'),
    topbar:                  mapped('TopBar'),
    children:                CONTENT,
    defaultSidenavExpanded:  false,
    onSidenavExpandedChange: undefined,
  },
  // sidenav / topbar are slots — each control picks what fills it, or leaves it empty
  argTypes: {
    sidenav:  { control: 'select', options: ['SideNav', 'none'], mapping: { SideNav: SIDENAV, none: undefined } },
    topbar:   { control: 'select', options: ['TopBar', 'none'], mapping: { TopBar: TOPBAR, none: undefined } },
    children: { control: false },
    sidenavExpanded:         { control: 'boolean' },
    defaultSidenavExpanded:  { control: 'boolean' },
    onSidenavExpandedChange: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

const renderShell = (width?: number): Story['render'] => (args) => (
  <div style={{ height: '100vh', maxWidth: width }}>
    {/* key: defaultSidenavExpanded is only read on mount — remount when its control changes */}
    <AppShell key={String(args.defaultSidenavExpanded)} {...args} />
  </div>
);

export const Default: Story = {
  render: renderShell(),
  parameters: {
    docs: { description: { story: 'The full page shell — SideNav + TopBar + scrollable main content, no hand-rolled display:flex anywhere.' } },
  },
};

export const Collapsed: Story = {
  render: renderShell(PHONE_WIDTH),
  parameters: {
    docs: { description: { story: 'Below 768px the SideNav collapses out of view and the TopBar shows a menu button (IconMenu2). The page gets the whole width.' } },
  },
};

export const Expanded: Story = {
  args: { defaultSidenavExpanded: true },
  render: renderShell(PHONE_WIDTH),
  parameters: {
    docs: { description: { story: 'The collapsed SideNav opened from the menu button: it slides in over the content, under the TopBar (aria-expanded="true" on the button).' } },
  },
};

export const KeyboardNavigation: Story = {
  render: renderShell(PHONE_WIDTH),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('button', { name: 'Navigation menu' });
    // Hidden while collapsed, so not reachable by role/name yet — the current page's link
    const current = canvasElement.querySelector<HTMLElement>('[aria-current="page"]')!;
    await expect(menu).toHaveAttribute('aria-expanded', 'false');

    // Enter opens it and moves focus to the current page's link
    menu.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(current).toHaveFocus());

    // Escape closes it and returns focus to the menu button
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu).toHaveAttribute('aria-expanded', 'false'));
    await expect(menu).toHaveFocus();

    // Space opens it again; Tab past its last link closes it and lands on the menu button
    await userEvent.keyboard('[Space]');
    await waitFor(() => expect(current).toHaveFocus());
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Settings' })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(menu).toHaveAttribute('aria-expanded', 'false'));
    await expect(menu).toHaveFocus();
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Enter and Space on the menu button open the collapsed SideNav and focus its current link; Escape closes it and returns focus to the button; tabbing past its last link closes it.' } },
  },
};
