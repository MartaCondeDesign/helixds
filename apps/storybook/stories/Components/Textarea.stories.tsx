import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { Textarea, TextareaDoc } from '@helix/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Textarea> = {
  title:     'Components/Textarea',
  component:  Textarea,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(TextareaDoc),
  // w-[300px] — same width-stability fix as Input/Select's own stories; className previously
  // reached the inner <textarea> field instead of textarea-root, so a consumer couldn't actually
  // constrain the component's width at all until that was fixed.
  args: { label: 'Description', placeholder: 'Write something…', size: 'm', className: 'w-[300px]' },
  argTypes: {
     size:      { control: 'select', options: ['s', 'm', 'l'] },
    resize:    { control: 'select', options: ['none', 'vertical', 'horizontal', 'both'] },
    rows:      { control: { type: 'number', min: 2, max: 10 } },
    maxLength: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: 'Shown below the input. Max 500 characters recommended.' },
};

export const WithCharacterCount: Story = {
  args: { maxLength: 280, showCount: true },
  render: (args) => {
    const [value, setValue] = useState('');
    return <Textarea {...args} value={value} onChange={e => setValue(e.target.value)} />;
  },
  parameters: {
    docs: { description: { story: 'Pass `maxLength` + `showCount` to render a live counter.' } },
  },
};

export const Invalid: Story = {
  args: {
    invalid:      true,
    errorMessage: 'This field is required.',
    value:        '',
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'This content is read-only and cannot be edited.' },
};

export const NoResize: Story = {
  args: { resize: 'none', rows: 5 },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
      <Textarea label="Small"  size="s" placeholder="size=s"           onChange={() => {}} />
      <Textarea label="Medium" size="m" placeholder="size=m (default)" onChange={() => {}} />
      <Textarea label="Large"  size="l" placeholder="size=l"           onChange={() => {}} />
    </div>
  ),
};

export const FullWidth: Story = {
  args: { fullWidth: true, rows: 4 },
  decorators: [Story => <div style={{ maxWidth: 480 }}><Story /></div>],
};

export const KeyboardFocus: Story = {
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: /Description/ });

    // Tab focuses the field
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.keyboard('First line');
    await expect(field).toHaveValue('First line');

    // Escape blurs it, keeping the value
    await userEvent.keyboard('{Escape}');
    await expect(field).not.toHaveFocus();
    await expect(field).toHaveValue('First line');
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab focuses the field, Escape blurs it without clearing the value.' } },
  },
};
