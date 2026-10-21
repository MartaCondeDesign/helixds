import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { MultiSelect, MultiSelectDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const SKILLS = [
  { value: 'design',   label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend',  label: 'Backend' },
  { value: 'writing',  label: 'Writing' },
];

const GROUPED = [
  {
    label: 'Design',
    options: [
      { value: 'ui', label: 'UI Design' },
      { value: 'ux', label: 'UX Research' },
      { value: 'ds', label: 'Design Systems' },
    ],
  },
  {
    label: 'Engineering',
    options: [
      { value: 'fe', label: 'Frontend' },
      { value: 'be', label: 'Backend' },
    ],
  },
];

const meta: Meta<typeof MultiSelect> = {
  title:     'Components/MultiSelect',
  component:  MultiSelect,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(MultiSelectDoc),
  // Fixed width like Select's own stories, so the chips wrap inside it instead of stretching the field.
  // Figma's order: the props that are Figma variants first, then the rest (each group in code order)
  args: {
    options: SKILLS,
    value: undefined,
    invalid: undefined,
    disabled: undefined,
    fullWidth: undefined,
    hideLabel: undefined,
    label: 'Skills',
    placeholder: 'Choose skills…',
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
type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {};

export const WithSelection: Story = {
  args: { defaultValue: ['design', 'frontend'] },
  argTypes: { placeholder: { control: false } }, // chosen values hide the placeholder
  parameters: {
    docs: { description: { story: 'Selected values sit inside the field as dismissible Chips (24px, size s), 4px from its edge and 4px apart. Each × removes one.' } },
  },
};

export const Wrapping: Story = {
  args: { defaultValue: ['design', 'research', 'frontend', 'backend', 'writing'] },
  argTypes: { placeholder: { control: false } }, // chosen values hide the placeholder
  parameters: {
    docs: { description: { story: 'When the chips don\'t fit on one line the field grows downward — 32px is a minimum, rows sit 4px apart.' } },
  },
};

export const WithGroups: Story = {
  args: { options: GROUPED, label: 'Specialties', placeholder: 'Choose specialties…' },
  parameters: {
    docs: { description: { story: 'Grouped options, same as Select.' } },
  },
};

export const WithDescription: Story = {
  args: { description: 'Pick everything this person can take on.' },
};

export const Invalid: Story = {
  args: { invalid: true, errorMessage: 'Choose at least one skill.' },
};

export const Required: Story = {
  args: { required: true },
  parameters: {
    docs: { description: { story: '`required`: at least one value must be chosen before the form submits (`aria-required`).' } },
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ['design'] },
  argTypes: { placeholder: { control: false } }, // the chosen value hides the placeholder
};

// Hidden from the sidebar and Docs (!dev, !autodocs) but still run by the test-runner — it's the
// keyboard play test ADR-018's "Keyboard" criterion reads.
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    const [values, setValues] = useState<string[]>([]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)' }}>
        <MultiSelect {...args} value={values} onChange={setValues} />
        <output data-testid="values">{values.join(',')}</output>
        <button type="button">After</button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const combobox = canvas.getByRole('combobox', { name: /Skills/ });
    const values = canvas.getByTestId('values');
    const highlighted = () => combobox.getAttribute('aria-activedescendant') ?? '';

    await userEvent.tab();
    await expect(combobox).toHaveFocus();

    // Arrow Down opens on the first option; Arrow Down/Up move the highlight
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(combobox).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(highlighted()).toMatch(/design$/));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(highlighted()).toMatch(/research$/));
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(highlighted()).toMatch(/design$/));

    // Enter toggles the highlighted option and the menu stays open
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(values).toHaveTextContent('design'));
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');

    // End / Home jump; Space toggles too
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(highlighted()).toMatch(/writing$/));
    await userEvent.keyboard('[Space]');
    await waitFor(() => expect(values).toHaveTextContent('design,writing'));
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(highlighted()).toMatch(/design$/));
    await userEvent.keyboard('{Enter}'); // toggling a selected option removes it
    await waitFor(() => expect(values).toHaveTextContent(/^writing$/));

    // Escape closes without touching the selection
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(combobox).toHaveAttribute('aria-expanded', 'false'));
    await expect(values).toHaveTextContent(/^writing$/);
    await expect(combobox).toHaveFocus(); // focus stays on the field, never lost with the closed menu

    // Backspace (menu closed) removes the last chip
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => expect(values).toBeEmptyDOMElement());

    // Enter opens; Tab closes the menu and moves focus on
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(combobox).toHaveAttribute('aria-expanded', 'true'));
    await userEvent.tab();
    await waitFor(() => expect(combobox).toHaveAttribute('aria-expanded', 'false'));
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
  },
  parameters: {
    docs: {
      description: {
        story: 'Keyboard test (contract `a11y.keyboardNav`): arrows open and move, Home/End jump, Enter/Space toggle without closing, Backspace removes the last chip, Escape closes, Tab closes and moves on.',
      },
    },
  },
};
