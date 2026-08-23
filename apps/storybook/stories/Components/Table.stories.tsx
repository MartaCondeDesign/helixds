import type { Meta, StoryObj } from '@storybook/react';
import {
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  TableDoc, Badge, Avatar, Button,
} from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Table> = {
  title:     'Components/Table',
  component:  Table,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(TableDoc),
};

export default meta;
type Story = StoryObj<typeof Table>;

const MEMBERS = [
  { name: 'Ana García',  role: 'Design Lead', status: 'success' as const, statusLabel: 'Active' },
  { name: 'Pau Torres',  role: 'Engineer',    status: 'success' as const, statusLabel: 'Active' },
  { name: 'Sara Navarro', role: 'Designer',   status: 'warning' as const, statusLabel: 'Invited' },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Member</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {MEMBERS.map(m => (
          <TableRow key={m.name}>
            <TableCell>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
                <Avatar label={m.name} size="s" />
                {m.name}
              </div>
            </TableCell>
            <TableCell>{m.role}</TableCell>
            <TableCell><Badge variant={m.status} label={m.statusLabel} /></TableCell>
            <TableCell><Button variant="ghost" size="s">···</Button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: { description: { story: 'Row hover is CSS-only. Cells hold real Helix components (Avatar, Badge, Button), not raw markup.' } },
  },
};
