import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { Switch, SwitchDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Switch> = {
  title:     'Components/Switch',
  component:  Switch,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SwitchDoc),
  args: { label: 'Enable notifications', size: 'm' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on"  disabled checked />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
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
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--helix-spacing-m)',
            padding: 'var(--helix-primitive-spacing-100)',
            borderBottom: i < arr.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--helix-color-text-neutral)' }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--helix-color-text-neutral-light)', marginTop: 'var(--helix-spacing-3xs)' }}>{desc}</div>
            </div>
            <Switch label={label} hideLabel checked={state[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Settings panel pattern: label + description on the left, switch on the right.' } },
  },
};

export const KeyboardToggle: Story = {
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('switch', { name: /Enable notifications/ });

    // Tab moves focus to the switch
    await userEvent.tab();
    await expect(toggle).toHaveFocus();

    // Space toggles it
    await userEvent.keyboard('[Space]');
    await expect(toggle).toBeChecked();
    await userEvent.keyboard('[Space]');
    await expect(toggle).not.toBeChecked();
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab focuses the switch, Space toggles it.' } },
  },
};
