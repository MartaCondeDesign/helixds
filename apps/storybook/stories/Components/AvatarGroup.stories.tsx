import type { Meta, StoryObj } from '@storybook/react';
import { AvatarGroup, AvatarGroupDoc } from '@helix/react';
import { createComponentDocsParameters } from '../_shared/component-docs';

const PEOPLE_WITH_PHOTOS = [
  { label: 'Ana García',  src: 'avatars/ana.jpg' },
  { label: 'Pau Torres',  src: 'avatars/pau.jpg' },
  { label: 'Marta Conde', src: 'avatars/marta.jpg' },
  { label: 'Jordi Puig',  src: 'avatars/jordi.jpg' },
  { label: 'Sara Navarro', src: 'avatars/sara.jpg' },
];

const PEOPLE_INITIALS = [
  { label: 'Ana García' },
  { label: 'Pau Torres' },
  { label: 'Marta Conde' },
  { label: 'Jordi Puig' },
];

const meta: Meta<typeof AvatarGroup> = {
  title:     'Components/AvatarGroup',
  component:  AvatarGroup,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(AvatarGroupDoc),
  args: { avatars: PEOPLE_WITH_PHOTOS.slice(0, 3), size: 'm' },
  argTypes: {
    size: {
      control: 'select',
      options: ['s', 'm', 'l'],
    },
    max: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: { description: { story: '3 people with photos, no overflow.' } },
  },
};

export const WithOverflow: Story = {
  args: { avatars: PEOPLE_WITH_PHOTOS, max: 3 },
  parameters: {
    docs: { description: { story: "3 visible photos + max=3 against 5 people — the remaining 2 collapse into a neutral '+2', always last (rightmost, on top)." } },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-150)', alignItems: 'center' }}>
      <AvatarGroup avatars={PEOPLE_INITIALS} max={3} size="s" />
      <AvatarGroup avatars={PEOPLE_INITIALS} max={3} size="m" />
      <AvatarGroup avatars={PEOPLE_INITIALS} max={3} size="l" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Initials-only avatars (no photos) across the s/m/l scale.' } },
  },
};

