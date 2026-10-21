import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Button, Menu, MenuDoc } from '@helixds/react';
import type { MenuProps } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const FRUITS = [
  { value: 'apple',  label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date',   label: 'Date' },
];

const GROUPED = [
  { label: 'Fruit',     options: [{ value: 'apple', label: 'Apple' }, { value: 'pear', label: 'Pear' }] },
  { label: 'Vegetable', options: [{ value: 'carrot', label: 'Carrot' }, { value: 'kale', label: 'Kale' }] },
];

const WITH_STATES = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear',  label: 'Pear' },
  { value: 'kiwi',  label: 'Kiwi', disabled: true },
];

// The story owns what an app would: the trigger, the open state and the chosen value. Every Menu prop
// comes from the story's args, so they all show (and can be changed) in the Controls panel.
function Demo(args: MenuProps) {
  const [open, setOpen] = useState(args.expanded);
  const [value, setValue] = useState<string | undefined>(args.value);
  const [values, setValues] = useState<string[]>(args.values ?? []);
  const anchorRef = useRef<HTMLButtonElement>(null);
  // follow the controls when they change
  useEffect(() => setOpen(args.expanded), [args.expanded]);
  useEffect(() => setValue(args.value), [args.value]);
  useEffect(() => setValues(args.values ?? []), [args.values]);

  return (
    <>
      <Button ref={anchorRef} variant="secondary" onClick={() => setOpen(o => !o)}>
        {(args.multiple ? (values.length ? `${values.length} selected` : undefined) : value) ?? 'Open menu'}
      </Button>
      <Menu
        {...args}
        expanded={open}
        anchorRef={anchorRef}
        value={value}
        values={values}
        onSelect={v => {
          args.onSelect?.(v);
          if (args.multiple) setValues(vs => (vs.includes(v) ? vs.filter(x => x !== v) : [...vs, v]));
          else { setValue(v); setOpen(false); }
        }}
      />
    </>
  );
}

const meta: Meta<typeof Menu> = {
  title:     'Components/Menu',
  component:  Menu,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(MenuDoc),
  // Figma's order: the props that are Figma variants first, then the rest (each group in code order)
  args: {
    options:  FRUITS,
    multiple: false,
    id:       'demo-menu',
    expanded: false,
    onSelect: fn(),
    value: undefined,
    values: undefined,
  },
  argTypes: {
    options:     { control: 'object' },
    value:       { control: 'text' },
    values:      { control: 'object' },
    expanded:    { control: 'boolean' },
    multiple:    { control: 'boolean' },
    anchorRef:   { control: false }, // the story's own trigger button — listed, not editable
    activeValue: { control: false }, // driven by the keyboard — listed, not editable
    className:   { table: { disable: true } },
  },
  render: args => <Demo {...args} />,
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Menu is normally consumed internally by Select (see Components/Select) — this story exercises it directly to show the primitive on its own.' } },
  },
};

export const Grouped: Story = {
  args: { options: GROUPED },
};

export const Opened: Story = {
  // Not in the docs page (an open overlay would cover it) — this story exists so the browser checks
  // (axe, contrast, visible focus, target size, what a screen reader hears) run on the OPEN state, which no
  // other story leaves on screen: their play tests open and close it again.
  tags: ['!autodocs'],
  args: { options: GROUPED },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open menu' }));
    // The list is portaled to <body>, outside the story's own root
    await waitFor(() => expect(within(document.body).getByRole('listbox')).toBeVisible());
  },
};

export const States: Story = {
  // Open from the start, with a selected and a disabled option — every MenuItem state on screen at once,
  // with no play function, so `pnpm figma:expected MenuItem` can measure them (scripts/figma/expected-styles.ts).
  tags: ['!autodocs'],
  args: { options: WITH_STATES, expanded: true, value: 'pear' },
};
