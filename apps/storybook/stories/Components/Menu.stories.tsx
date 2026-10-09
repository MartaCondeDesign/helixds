import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Menu, MenuDoc } from '@helixds/react';
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

function Demo({ options }: { options: typeof FRUITS | typeof GROUPED }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | undefined>();
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          height: 32, padding: '0 var(--helix-spacing-s)', borderRadius: 6,
          border: '1px solid var(--helix-color-border-neutral)',
          background: 'var(--helix-color-fill-page)', color: 'var(--helix-color-text-neutral)',
          fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
        }}
      >
        {value ?? 'Open menu'}
      </button>
      <Menu
        id="demo-menu"
        expanded={open}
        anchorRef={anchorRef}
        options={options}
        value={value}
        onSelect={v => { setValue(v); setOpen(false); }}
      />
    </>
  );
}

const meta: Meta<typeof Menu> = {
  title:     'Components/Menu',
  component:  Menu,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(MenuDoc),
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: () => <Demo options={FRUITS} />,
  parameters: {
    docs: { description: { story: 'Menu is normally consumed internally by Select (see Components/Select) — this story exercises it directly to show the primitive on its own.' } },
  },
};

export const Grouped: Story = {
  render: () => <Demo options={GROUPED} />,
};
