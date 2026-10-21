import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Avatar> = {
  title:     'Components/Avatar',
  component:  Avatar,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(AvatarDoc),
  args: { label: 'Ana García', size: 'm' },
  argTypes: {
    size: {
      control: 'select',
      options: ['s', 'm', 'l'],
    },
    label: { control: 'text' },
    src:   { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = { args: {} };

export const Sizes: Story = {
  // The story fixes size (s / m / l) — label and src apply to all three
  argTypes: { size: { control: false } },
  render: ({ size: _size, ...args }) => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center' }}>
      <Avatar {...args} size="s" />
      <Avatar {...args} size="m" />
      <Avatar {...args} size="l" />
    </div>
  ),
};

export const WithImage: Story = {
  args: { label: 'Pau Torres', src: 'avatars/pau.jpg' },
};

export const BrokenImageFallsBackToInitials: Story = {
  args: { label: 'Sara Navarro', src: 'https://broken.invalid/none.jpg' },
  parameters: {
    controlsCheck: { skip: ['src'], reason: 'after a failed load Avatar keeps the initials until it remounts' },
    docs: { description: { story: 'When the image URL fails to load, Avatar falls back to initials automatically — no consumer handling needed.' } },
  },
};

export const MemberList: Story = {
  // The story fixes each member's name (no photo) — size applies to every avatar
  argTypes: { label: { control: false }, src: { control: false } },
  render: ({ label: _label, src: _src, ...args }) => {
    const members = ['Ana García', 'Pau Torres', 'Marta Conde', 'Jordi Puig'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-50)' }}>
        {members.map(m => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
            <Avatar {...args} label={m} />
            <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)' }}>{m}</span>
          </div>
        ))}
      </div>
    );
  },
};
