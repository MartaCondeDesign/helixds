import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Select, SelectDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const ROLES = [
  { value: 'designer', label: 'Designer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'pm',       label: 'Product Manager' },
  { value: 'lead',     label: 'Tech Lead' },
  { value: 'other',    label: 'Other' },
];

const GROUPED = [
  {
    label: 'Design',
    options: [
      { value: 'ui', label: 'UI Designer' },
      { value: 'ux', label: 'UX Researcher' },
      { value: 'ds', label: 'Design Systems' },
    ],
  },
  {
    label: 'Engineering',
    options: [
      { value: 'fe', label: 'Frontend' },
      { value: 'be', label: 'Backend' },
      { value: 'fs', label: 'Full-stack' },
    ],
  },
];

const meta: Meta<typeof Select> = {
  title:     'Components/Select',
  component:  Select,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(SelectDoc),
  // w-[300px] — a true fixed width, not min-width. Without a consumer-set width at all, the
  // trigger's width is driven by whichever option's label is currently selected and visibly
  // shrinks/grows as the selection changes (e.g. "Product Manager" vs "PM"); min-width alone only
  // stops it shrinking below a floor, it can still grow past that for a longer label — the trigger
  // now truncates a label that doesn't fit with an ellipsis (select-trigger-label) instead of
  // growing the box, matching a native <select>'s own behavior at a fixed width. Select has no
  // built-in default per CLAUDE.md's min-width policy (a consumer/pattern decision, not a system
  // token) — this is the demonstrated example default.
  // Figma's order: the props that are Figma variants first, then the rest (each group in code order)
  args: {
    options: ROLES,
    value: undefined,
    invalid: undefined,
    disabled: undefined,
    fullWidth: undefined,
    hideLabel: undefined,
    label: 'Role',
    placeholder: 'Choose a role…',
    defaultValue: undefined,
    onChange: undefined,
    description: undefined,
    errorMessage: undefined,
    required: undefined,
    id: undefined,
    name: undefined,
    className: 'w-[300px]',
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Controlled: Story = {
  argTypes: { value: { control: false }, defaultValue: { control: false } }, // the story holds the value in state
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
        <Select {...args} value={value} onChange={setValue} />
        {value && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--helix-color-text-neutral-light)' }}>
            Selected: <strong>{value}</strong>
          </p>
        )}
      </div>
    );
  },
};

export const WithGroups: Story = {
  args: { options: GROUPED, label: 'Specialty', placeholder: 'Select specialty…' },
  parameters: {
    docs: { description: { story: 'Pass `{ label, options }[]` for grouped `<optgroup>` rendering.' } },
  },
};

// labelEnd: short secondary text on the end edge of each option — values line up down the list.
export const WithLabelEnd: Story = {
  args: {
    label: 'Task',
    options: [
      { value: 'button-basic', label: 'button-basic', labelEnd: '81%' },
      { value: 'chip-basic', label: 'chip-basic', labelEnd: '58%' },
      { value: 'card-basic', label: 'card-basic', labelEnd: '–' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: /Task/ }));
    const option = await within(document.body).findByRole('option', { name: /chip-basic/ });
    await expect(option).toHaveTextContent('58%');
    await expect(option.querySelector('[data-helix-part="menu-item-label-end"]')).not.toBeNull();
  },
  parameters: {
    docs: { description: { story: 'Each option can carry a `labelEnd` — a value, count or percentage on its end edge. The trigger shows only the label.' } },
  },
};

export const WithDescription: Story = {
  args: { description: 'Used to assign permissions on this workspace.' },
};

export const Invalid: Story = {
  args: { invalid: true, errorMessage: 'Please select a role to continue.' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'designer' },
  argTypes: { placeholder: { control: false } }, // the chosen value hides the placeholder
};

export const MinimumWidth: Story = {
  // no fixed width here: the story is about how the trigger hugs its content
  args: { className: undefined },
  // each Select's label, options, placeholder and value are fixed — the rest applies to both
  argTypes: { label: { control: false }, placeholder: { control: false }, value: { control: false }, defaultValue: { control: false } },
  render: (args) => {
    const [role, setRole] = useState('');
    const [count, setCount] = useState('');
    return (
      <div style={{ display: 'flex', gap: 'var(--helix-spacing-m)', alignItems: 'flex-end' }}>
        <Select
          {...args}
          label="Role"
          options={[{ value: 'pm', label: 'PM' }, { value: 'qa', label: 'QA' }]}
          placeholder="Role"
          value={role}
          onChange={setRole}
        />
        <Select
          {...args}
          label="Seats"
          options={['1', '2', '1000', '2000'].map(n => ({ value: n, label: n }))}
          placeholder="1"
          value={count}
          onChange={setCount}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: /Role/ }));
  },
  parameters: {
    docs: {
      description: {
        story: 'Width rule: the trigger has no minimum and hugs its content, but the menu does — word options ("PM", "QA") open a menu at least 150px wide; an all-numeric list (1, 2, 1000, 2000) has no minimum. Shown with the word menu open.',
      },
    },
  },
};

export const Required: Story = {
  args: { required: true },
  parameters: {
    docs: { description: { story: '`required`: a value must be chosen before the form submits — adds the required indicator and `aria-required`.' } },
  },
};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: /Role/ }));
  },
  parameters: {
    docs: { description: { story: 'The open state — the popup listbox showing, `aria-expanded="true"` on the trigger.' } },
  },
};

export const KeyboardNavigation: Story = {
  argTypes: { value: { control: false }, defaultValue: { control: false } }, // the story holds the value in state
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
        <Select {...args} value={value} onChange={setValue} />
        <button type="button">After</button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Role/ });
    const highlighted = () => trigger.getAttribute('aria-activedescendant') ?? '';

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    // Arrow Down opens the menu on the first option; Arrow Down/Up move the highlight
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(highlighted()).toMatch(/designer$/));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(highlighted()).toMatch(/engineer$/));
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(highlighted()).toMatch(/designer$/));

    // Home / End jump to the first / last option
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(highlighted()).toMatch(/other$/));
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(highlighted()).toMatch(/designer$/));

    // Escape closes without changing the selection
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(trigger).toHaveTextContent('Choose a role…');
    await expect(trigger).toHaveFocus(); // focus stays on the trigger, never lost with the closed menu

    // Enter opens; Enter confirms the highlighted option
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(trigger).toHaveTextContent('Engineer');

    // Space opens too; Tab closes the menu and moves focus on
    await userEvent.keyboard('[Space]');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
  },
  parameters: {
    // the play test leaves an option chosen, and a chosen option hides the placeholder
    controlsCheck: { skip: ['placeholder'], reason: 'the play test leaves a value, which hides the placeholder' },
    docs: {
      description: {
        story: 'Keyboard test (contract `a11y.keyboardNav`): arrows open and move the highlight, Home/End jump, Enter/Space open and confirm, Escape closes without selecting, Tab closes and moves focus on.',
      },
    },
  },
};
