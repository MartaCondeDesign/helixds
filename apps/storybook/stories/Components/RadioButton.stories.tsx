import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { RadioButton, RadioButtonDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof RadioButton> = {
  title:     'Components/RadioButton',
  component:  RadioButton,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(RadioButtonDoc),
  args: { label: 'Free' },
};

export default meta;
type Story = StoryObj<typeof RadioButton>;

// Every story below renders through the same fixed-width wrapper — otherwise switching between
// stories with different natural content widths shifts the component's on-screen position, which
// reads as the component itself "jumping" instead of just changing shape/state in place.
const FIXED_WIDTH = '280px';

export const AllTypes: Story = {
  // The story fixes each radio's label and checked state — the rest applies to both
  argTypes: { label: { control: false }, checked: { control: false }, defaultChecked: { control: false } },
  render: ({ description, disabled, required, invalid, errorMessage }) => {
    const [checked, setChecked] = useState(false);
    const shared = { description, disabled, required, invalid, errorMessage };
    return (
      <div style={{ width: FIXED_WIDTH, display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
        <RadioButton {...shared} label="Default" checked={checked} onChange={() => setChecked(true)} />
        <RadioButton {...shared} label="Checked" checked />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Default (interactive) and Checked — no indeterminate state, radios are mutually exclusive, not partial.' } },
  },
};

export const WithDescription: Story = {
  args: { description: 'Up to 3 editors, unlimited viewers' },
  decorators: [Story => <div style={{ width: FIXED_WIDTH }}><Story /></div>],
};

export const Invalid: Story = {
  args: {
    invalid:      true,
    errorMessage: 'Please select a plan to continue.',
  },
  decorators: [Story => <div style={{ width: FIXED_WIDTH }}><Story /></div>],
  parameters: {
    docs: { description: { story: 'An error message renders directly under the label, same structure as Checkbox\'s own `errorMessage`.' } },
  },
};

export const Disabled: Story = {
  args: { label: 'Disabled' },
  // The story fixes disabled (on) and checked (off / on) — label, description… apply to both
  argTypes: { disabled: { control: false }, checked: { control: false }, defaultChecked: { control: false } },
  render: ({ label, description, required, invalid, errorMessage }) => {
    const shared = { label, description, required, invalid, errorMessage };
    return (
      <div style={{ width: FIXED_WIDTH, display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
        <RadioButton {...shared} disabled />
        <RadioButton {...shared} disabled checked />
      </div>
    );
  },
};

export const Group: Story = {
  // The story fixes each option's label, name, value and checked state — disabled, invalid… apply to all three
  argTypes: {
    label: { control: false }, name: { control: false }, value: { control: false },
    checked: { control: false }, defaultChecked: { control: false },
  },
  render: ({ description, disabled, required, invalid, errorMessage }) => {
    const shared = { description, disabled, required, invalid, errorMessage };
    const [plan, setPlan] = useState('free');
    return (
      <div style={{ width: FIXED_WIDTH, display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-s)' }}>
        <RadioButton
          {...shared}
          label="Free"
          name="plan-grouped"
          value="free"
          checked={plan === 'free'}
          onChange={() => setPlan('free')}
        />
        <RadioButton
          {...shared}
          label="Pro"
          name="plan-grouped"
          value="pro"
          checked={plan === 'pro'}
          onChange={() => setPlan('pro')}
        />
        <RadioButton
          {...shared}
          label="Enterprise"
          name="plan-grouped"
          value="enterprise"
          checked={plan === 'enterprise'}
          onChange={() => setPlan('enterprise')}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Standalone RadioButtons sharing one `name` — native mutual exclusivity, same as RadioGroup\'s own options, without the fieldset wrapper.' } },
  },
};

export const KeyboardSelect: Story = {
  play: async ({ canvasElement }) => {
    const radio = within(canvasElement).getByRole('radio', { name: /Free/ });

    // Tab moves focus to it
    await userEvent.tab();
    await expect(radio).toHaveFocus();

    // Space selects it
    await userEvent.keyboard('[Space]');
    await expect(radio).toBeChecked();
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab focuses the radio, Space selects it.' } },
  },
};
