import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import {
  IconMail,
  IconLock,
  IconSearch,
  IconUser,
  IconEye,
} from '@tabler/icons-react';
import { Input, Button, Badge, InputDoc } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Input> = {
  title:     'Components/Input',
  component:  Input,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(InputDoc),
  args: {
    label:    'Label',
    onChange: fn(),
  },
  argTypes: {
     size:      { control: 'select', options: ['s', 'm', 'l'] },
    invalid:   { control: 'boolean' },
    disabled:  { control: 'boolean' },
    required:  { control: 'boolean' },
    loading:   { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    hideLabel: { control: 'boolean' },
    icon:      { table: { disable: true } },
    iconEnd:   { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
};

export const WithDescription: Story = {
  args: {
    label:       'Password',
    type:        'password',
    description: 'Must be at least 8 characters long.',
  },
};

export const WithLeadingIcon: Story = {
  args: {
    label:       'Email',
    type:        'email',
    icon:        <IconMail size={16} />,
    placeholder: 'you@example.com',
  },
};

export const WithTrailingIcon: Story = {
  args: {
    label:   'Password',
    type:    'password',
    iconEnd: <IconEye size={16} />,
  },
};

export const SearchInput: Story = {
  args: {
    label:       'Search',
    hideLabel:   true,
    icon:        <IconSearch size={16} />,
    placeholder: 'Search projects…',
    type:        'search',
    fullWidth:   true,
  },
  parameters: {
    docs: {
      description: {
        story: '`hideLabel` hides the label visually but keeps it for screen readers. Required for search inputs.',
      },
    },
  },
};

export const Invalid: Story = {
  args: {
    label:        'Email',
    type:         'email',
    icon:         <IconMail size={16} />,
    invalid:      true,
    errorMessage: 'Enter a valid email address',
    defaultValue: 'not-an-email',
  },
};

export const Required: Story = {
  args: {
    label:    'Full name',
    required: true,
    icon:     <IconUser size={16} />,
  },
};

export const Disabled: Story = {
  args: {
    label:        'Email',
    disabled:     true,
    defaultValue: 'user@company.com',
    description:  'Contact your admin to change this.',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-125)', maxWidth: '360px' }}>
      <Input label="Small"  size="s" placeholder="size=s" icon={<IconSearch size={14} />} onChange={() => {}} />
      <Input label="Medium" size="m" placeholder="size=m (default)" icon={<IconSearch size={16} />} onChange={() => {}} />
      <Input label="Large"  size="l" placeholder="size=l" icon={<IconSearch size={18} />} onChange={() => {}} />
    </div>
  ),
};

export const LoginFormPattern: Story = {
  render: () => {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [isLoading, setIsLoading]       = useState(false);
    const [formError, setFormError]       = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setFormError(null);
      setEmailInvalid(false);
      if (!email.includes('@')) { setEmailInvalid(true); return; }
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      setIsLoading(false);
      setFormError('Incorrect email or password. Please try again.');
    }

    return (
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-125)',
          maxWidth: '360px', padding: 'var(--helix-primitive-spacing-200)',
          background: 'var(--helix-color-fill-surface)',
          borderRadius: 'var(--helix-radius-xl)',
          border: '1px solid var(--helix-color-border-neutral)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'var(--helix-primitive-fontSize-2xl)', fontWeight: 'var(--helix-primitive-fontWeight-bold)', color: 'var(--helix-color-text-neutral)' }}>
          Sign in
        </h2>

        {formError && <Badge variant="danger" label={formError} />}

        <Input
          label="Email" type="email" required autoComplete="email"
          icon={<IconMail size={16} />}
          value={email} onChange={e => setEmail(e.target.value)}
          invalid={emailInvalid} errorMessage="Enter a valid email address" fullWidth
        />

        <Input
          label="Password" type="password" required autoComplete="current-password"
          icon={<IconLock size={16} />} description="Min. 8 characters"
          value={password} onChange={e => setPassword(e.target.value)} fullWidth
        />

        <Button variant="primary" type="submit" loading={isLoading} fullWidth>
          Sign in
        </Button>
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Login form pattern. Try submitting with an invalid email.',
      },
    },
  },
};
