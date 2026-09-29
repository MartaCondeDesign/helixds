import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
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

export const KeyboardActivation: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, width: 200 }}>
      <NavItem label="Dashboard" href="#dashboard" icon={IconLayoutDashboard} />
      <NavItem label="Team" href="#team" icon={IconUsers} current />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dashboard = canvas.getByRole('link', { name: 'Dashboard' });
    const team = canvas.getByRole('link', { name: 'Team' });
    // Record activation without actually navigating the preview iframe
    const onActivate = fn((e: Event) => e.preventDefault());
    team.addEventListener('click', onActivate);

    // Tab moves through the items in order
    await userEvent.tab();
    await expect(dashboard).toHaveFocus();
    await userEvent.tab();
    await expect(team).toHaveFocus();

    // Enter activates the focused link
    await userEvent.keyboard('{Enter}');
    await expect(onActivate).toHaveBeenCalledTimes(1);
    team.removeEventListener('click', onActivate);
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab moves between items, Enter follows the focused link.' } },
  },
};
