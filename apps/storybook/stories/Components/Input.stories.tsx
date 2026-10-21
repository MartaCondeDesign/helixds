import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { useState } from 'react';
import {
  IconMail,
  IconLock,
  IconSearch,
  IconUser,
  IconEye,
} from '@tabler/icons-react';
import { Input, Button, Badge, InputDoc } from '@helixds/react';
import { createComponentDocsParameters } from '../_shared/component-docs';
import { mapped } from '../_shared/mapped-arg';

const meta: Meta<typeof Input> = {
  title:     'Components/Input',
  component:  Input,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(InputDoc),
  // The field brings its own width (320px — every form field shares it, form-field rule); no className width here
  args: {
    hideLabel: undefined,
    invalid: undefined,
    isLoading: undefined,
    fullWidth: undefined,
    disabled: undefined,
    label:    'Label',
    onChange: fn(),
    type: undefined,
    placeholder: undefined,
    required: undefined,
    icon: undefined,
    iconEnd: undefined,
    description: undefined,
    errorMessage: undefined,
    invalidAttempt: undefined,
    className: undefined,
  },
  argTypes: {
    invalid:   { control: 'boolean' },
    disabled:  { control: 'boolean' },
    required:  { control: 'boolean' },
    isLoading:   { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    hideLabel: { control: 'boolean' },
    // icon / iconEnd take the Tabler component itself — the control picks one by name
    icon: {
      control: 'select',
      options: ['none', 'Mail', 'Lock', 'Search', 'User'],
      mapping: { none: undefined, Mail: IconMail, Lock: IconLock, Search: IconSearch, User: IconUser },
    },
    iconEnd: {
      control: 'select',
      options: ['none', 'Eye', 'Search'],
      mapping: { none: undefined, Eye: IconEye, Search: IconSearch },
    },
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
    icon:        mapped('Mail'),
    placeholder: 'you@example.com',
  },
};

export const WithTrailingIcon: Story = {
  args: {
    label:   'Password',
    type:    'password',
    iconEnd: mapped('Eye'),
  },
};

export const SearchInput: Story = {
  args: {
    label:       'Search',
    hideLabel:   true,
    icon:        mapped('Search'),
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
    icon:         mapped('Mail'),
    invalid:      true,
    errorMessage: 'Enter a valid email address',
    defaultValue: 'not-an-email',
  },
};

export const Required: Story = {
  args: {
    label:    'Full name',
    required: true,
    icon:     mapped('User'),
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

export const Loading: Story = {
  args: {
    label:        'Username',
    isLoading:    true,
    defaultValue: 'marta',
    description:  'Checking that the name is free…',
  },
  parameters: {
    docs: { description: { story: '`isLoading` locks the field and shows a spinner where `iconEnd` sits — the same spinner Button uses — while an async check runs (`aria-busy`).' } },
  },
};

export const LoginFormPattern: Story = {
  // The form fixes each field's label, icon, validation and loading — disabled and hideLabel apply to both fields
  argTypes: {
    label: { control: false }, icon: { control: false }, iconEnd: { control: false },
    description: { control: false }, errorMessage: { control: false }, invalid: { control: false },
    invalidAttempt: { control: false }, required: { control: false }, isLoading: { control: false },
    fullWidth: { control: false },
  },
  render: ({ disabled, hideLabel }) => {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [emailAttempt, setEmailAttempt] = useState(0);
    const [isLoading, setIsLoading]       = useState(false);
    const [formError, setFormError]       = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setFormError(null);
      if (!email.includes('@')) {
        // Bumping invalidAttempt (not just setEmailInvalid(true)) is what makes the
        // shake replay on a second failed submit — invalid alone can stay true across
        // both attempts with nothing in between to edge-detect.
        setEmailInvalid(true);
        setEmailAttempt(n => n + 1);
        return;
      }
      setEmailInvalid(false);
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
          disabled={disabled} hideLabel={hideLabel}
          label="Email" type="email" required autoComplete="email"
          icon={IconMail}
          value={email} onChange={e => setEmail(e.target.value)}
          invalid={emailInvalid} invalidAttempt={emailAttempt} errorMessage="Enter a valid email address" fullWidth
        />

        <Input
          disabled={disabled} hideLabel={hideLabel}
          label="Password" type="password" required autoComplete="current-password"
          icon={IconLock} description="Min. 8 characters"
          value={password} onChange={e => setPassword(e.target.value)} fullWidth
        />

        <Button variant="primary" type="submit" isLoading={isLoading} fullWidth>
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

export const KeyboardFocus: Story = {
  args: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: /Email/ });

    // Tab focuses the field
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.keyboard('ana@helix.dev');
    await expect(field).toHaveValue('ana@helix.dev');

    // Escape blurs it, keeping the value
    await userEvent.keyboard('{Escape}');
    await expect(field).not.toHaveFocus();
    await expect(field).toHaveValue('ana@helix.dev');
  },
  parameters: {
    docs: { description: { story: 'Keyboard test (contract `a11y.keyboardNav`): Tab focuses the field, Escape blurs it without clearing the value.' } },
  },
};
