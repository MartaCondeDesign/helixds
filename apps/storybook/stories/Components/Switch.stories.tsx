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
  args: { label: 'Dark mode' },
  argTypes: { checked: { control: false }, defaultChecked: { control: false } }, // the story holds the state
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return <Switch {...args} checked={checked} onChange={setChecked} />;
  },
};

export const Checked: Story = {
  args: { checked: true, label: 'Auto-save enabled', description: 'Changes are saved every 30 seconds.' },
};

export const WithDescription: Story = {
  args: { label: 'Email digest', description: 'Receive a weekly summary of activity in your workspace.' },
  render: (args) => {
    const [checked, setChecked] = useState(true);
    return (
      <Switch
        {...args}
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

export const Disabled: Story = {
  args: { label: 'Disabled' },
  // The story fixes disabled (on) and checked (off / on) — label, size… apply to both
  argTypes: { disabled: { control: false }, checked: { control: false }, defaultChecked: { control: false } },
  render: ({ label, hideLabel, description, size }) => {
    const shared = { label, hideLabel, description, size };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
        <Switch {...shared} disabled />
        <Switch {...shared} disabled checked />
      </div>
    );
  },
};

export const Sizes: Story = {
  // The story fixes size (s / m) and each one's label — checked, disabled… apply to both
  argTypes: { size: { control: false }, label: { control: false } },
  args: { checked: true },
  render: ({ checked, disabled, hideLabel, description }) => {
    const shared = { checked, disabled, hideLabel, description };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
        <Switch {...shared} size="s" label="Small" />
        <Switch {...shared} size="m" label="Medium (default)" />
      </div>
    );
  },
};

export const SettingsGroup: Story = {
  // The story fixes each row's label and on/off state — size and disabled apply to every switch
  argTypes: {
    label: { control: false }, hideLabel: { control: false }, description: { control: false },
    checked: { control: false }, defaultChecked: { control: false },
  },
  render: ({ size, disabled }) => {
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
            <Switch size={size} disabled={disabled} label={label} hideLabel checked={state[key]} onChange={() => toggle(key)} />
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
