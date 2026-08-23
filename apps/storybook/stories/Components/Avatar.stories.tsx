import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Avatar> = {
  title:     'Components/Avatar',
  component:  Avatar,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(AvatarDoc),
  args: { label: 'Ana García', size: 'm', variant: 'light' },
  argTypes: {
    size: {
      control: 'select',
      options: ['s', 'm', 'l'],
    },
    variant: {
      control: 'select',
      options: ['light', 'solid'],
    },
    label: { control: 'text' },
    src:   { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = { args: {} };

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center' }}>
      <Avatar label="Ana García" size="s" />
      <Avatar label="Ana García" size="m" />
      <Avatar label="Ana García" size="l" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-75)', alignItems: 'center' }}>
      <Avatar label="Ana García" variant="light" />
      <Avatar label="Ana García" variant="solid" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'light for dense repeated rows (a table, a list); solid for a single emphasized avatar (the current user).' } },
  },
};

export const WithImage: Story = {
  args: { label: 'Pau Torres', src: 'https://i.pravatar.cc/64?u=pau' },
};

export const BrokenImageFallsBackToInitials: Story = {
  args: { label: 'Sara Navarro', src: 'https://broken.invalid/none.jpg' },
  parameters: {
    docs: { description: { story: 'When the image URL fails to load, Avatar falls back to initials automatically — no consumer handling needed.' } },
  },
};

export const MemberList: Story = {
  render: () => {
    const members = ['Ana García', 'Pau Torres', 'Marta Conde', 'Jordi Puig'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-50)' }}>
        {members.map(m => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
            <Avatar label={m} size="m" />
            <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)' }}>{m}</span>
          </div>
        ))}
      </div>
    );
  },
};
