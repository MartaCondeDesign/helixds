import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox, CheckboxDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Checkbox> = {
  title:     'Components/Checkbox',
  component:  Checkbox,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(CheckboxDoc),
  args: { label: 'Accept terms of service' },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const AllTypes: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-100)', alignItems: 'center' }}>
        <Checkbox label="Default" checked={checked} onChange={setChecked} />
        <Checkbox label="Checked" checked />
        <Checkbox label="Indeterminate" indeterminate />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Default (interactive), Checked, and Indeterminate — indeterminate is used in a parent checkbox when only some children are checked.' } },
  },
};

export const WithDescription: Story = {
  args: {
    label:       'Subscribe to changelog',
    description: 'Get a weekly email with new features and fixes.',
    checked:     false,
  },
};

export const Invalid: Story = {
  args: {
    label:        'I agree to the Terms of Service',
    invalid:      true,
    errorMessage: 'You must accept the terms to continue.',
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
      <Checkbox label="Disabled unchecked" disabled />
      <Checkbox label="Disabled checked"   disabled checked />
    </div>
  ),
};

export const Group: Story = {
  render: () => {
    const options = ['Design tokens', 'Component library', 'Pattern docs', 'Storybook setup'];
    const [selected, setSelected] = useState<string[]>(['Design tokens', 'Component library']);

    const allChecked  = selected.length === options.length;
    const someChecked = selected.length > 0 && !allChecked;

    function toggle(opt: string) {
      setSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
    }
    function toggleAll() {
      setSelected(allChecked ? [] : options);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-25)' }}>
        <Checkbox
          label="Select all"
          checked={allChecked}
          indeterminate={someChecked}
          onChange={toggleAll}
        />
        {/* 24px = checkbox size (16px) + checkbox gap (8px) — lines each child's own checkbox up
            directly under "Select all"'s label text, not just under its checkbox square. */}
        <div style={{ paddingLeft: 'var(--helix-primitive-spacing-150)', display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-25)' }}>
          {options.map(opt => (
            <Checkbox key={opt} label={opt} checked={selected.includes(opt)} onChange={() => toggle(opt)} />
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Parent–child checkbox group with indeterminate state on the parent.' } },
  },
};
