import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Switch } from '@helix-ds/core';

const meta: Meta<typeof Switch> = {
  title:     'Components/Switch',
  component:  Switch,
  tags:      ['autodocs'],
  parameters: {
    helixTokens: [
      { part: 'switch', label: 'Switch width (s)', token: '--helix-switch-width-s', kind: 'space' },
      { part: 'switch', label: 'Switch width (m)', token: '--helix-switch-width-m', kind: 'space' },
      { part: 'switch', label: 'Switch height (s)', token: '--helix-switch-height-s', kind: 'space' },
      { part: 'switch', label: 'Switch height (m)', token: '--helix-switch-height-m', kind: 'space' },
      { part: 'switch', label: 'Thumb size (s)', token: '--helix-switch-thumb-size-s', kind: 'space' },
      { part: 'switch', label: 'Thumb size (m)', token: '--helix-switch-thumb-size-m', kind: 'space' },
      { part: 'switch', label: 'On fill', token: '--helix-switch-track-fill-on', kind: 'color' },
      { part: 'switch', label: 'Off fill', token: '--helix-switch-track-fill-off', kind: 'color' },
      { part: 'switch', label: 'Focus border', token: '--helix-switch-border-focus', kind: 'color' },
    ],
    docs: {
      description: {
        component: 'Toggle control for binary on/off settings. Uses `<button role="switch">` for maximum accessibility. Includes a hidden native checkbox for form integration.',
      },
    },
  },
  args: { label: 'Enable notifications' },
  argTypes: {
    size: { control: 'select', options: ['s', 'm'] },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Switch label="Dark mode" checked={checked} onChange={setChecked} />;
  },
};

export const Checked: Story = {
  args: { checked: true, label: 'Auto-save enabled', description: 'Changes are saved every 30 seconds.' },
};

export const WithDescription: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <Switch
        label="Email digest"
        description="Receive a weekly summary of activity in your workspace."
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-3)' }}>
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on"  disabled checked />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-4)' }}>
      <Switch size="s" label="Small"             defaultChecked />
      <Switch size="m" label="Medium (default)"  defaultChecked />
    </div>
  ),
};

export const SettingsGroup: Story = {
  render: () => {
    const [state, setState] = useState({
      updates:     true,
      marketing:   false,
      security:    true,
      activityLog: false,
    });
    const toggle = (key: keyof typeof state) =>
      setState(s => ({ ...s, [key]: !s[key] }));

    return (
      <div style={{
        maxWidth: 480,
        border: '1px solid var(--helix-color-border-neutral)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {([
          ['updates',     'Product updates',  'New features and changelog notifications'],
          ['marketing',   'Tips & tutorials', 'Learn how to get the most out of Helix'],
          ['security',    'Security alerts',  'Unusual sign-ins and permission changes'],
          ['activityLog', 'Activity digest',  'Weekly summary of workspace activity'],
        ] as [keyof typeof state, string, string][]).map(([key, label, desc], i, arr) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
            padding: 'var(--helix-primitive-spacing-4)',
            borderBottom: i < arr.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--helix-color-text-neutral)' }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--helix-color-text-neutral-light)', marginTop: 2 }}>{desc}</div>
            </div>
            <Switch checked={state[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Settings panel pattern: label + description on the left, switch on the right.' } },
  },
};
