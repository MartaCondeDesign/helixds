import type { Meta, StoryObj } from '@storybook/react';
import { IconPlus } from '@tabler/icons-react';
import { PageHeader, PageHeaderDoc, Button, Badge } from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof PageHeader> = {
  title:     'Components/PageHeader',
  component:  PageHeader,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(PageHeaderDoc),
  args: { label: 'Team', level: 1 },
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2],
    },
    label:       { control: 'text' },
    description: { control: 'text' },
    actions:     { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: { label: 'Team', description: 'Manage members and their access to the Helix workspace.' },
};

export const WithActions: Story = {
  render: () => (
    <PageHeader
      label="Team"
      description="Manage members and their access to the Helix workspace."
      actions={
        <>
          <Badge variant="success" label="+2 this month" />
          <Button variant="primary" icon={IconPlus}>Invite member</Button>
        </>
      }
    />
  ),
};

export const SectionLevel: Story = {
  args: { label: 'Danger zone', description: 'These actions cannot be undone.', level: 2 },
  parameters: {
    docs: { description: { story: 'level=2 renders an h2 for a major in-page section, smaller than the page-level h1.' } },
  },
};
