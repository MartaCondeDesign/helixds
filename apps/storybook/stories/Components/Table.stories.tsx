import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { IconGripVertical } from '@tabler/icons-react';
import {
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  TableDoc, Badge, Avatar, Button, Icon,
} from '@helix-ds/core';
import { createComponentDocsParameters } from '../_shared/component-docs';

const meta: Meta<typeof Table> = {
  title:     'Components/Table',
  component:  Table,
  tags:      ['autodocs'],
  parameters: createComponentDocsParameters(TableDoc),
  argTypes: {
    // Documentation-only entry — NOT a real Table prop (Table's actual TableProps is just
    // children/className). Drag-to-reorder rows is a compositional pattern, not something Table itself
    // implements — see Pages/Team Dashboard and .ai/maps/patterns/motion-effects.md. Surfaced here (with
    // control:false, so it's display-only) specifically so it's visible on this Docs page, not just
    // buried in a .ts file nobody opens.
    dragReorder: {
      control: false,
      table: { category: 'Behavior', type: { summary: 'pattern, not a prop' } },
      description: 'Not a Table prop. Rows can be composed with Motion\'s `Reorder.Group`/`Reorder.Item` (`as="tbody"`/`as="tr"`) for drag-to-reorder — see Pages/Team Dashboard for a live example and `.ai/maps/patterns/motion-effects.md` for the pattern.',
    },
    // The `as any` below is required, not a shortcut: TableProps has no `dragReorder` key (correctly —
    // it isn't a real prop), so Storybook's ArgTypes<TableProps> type rejects the object literal outright.
    // Confirmed by trying without the cast first (TS2353).
  } as any,
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

// ── DragReorder — the live example the "dragReorder" argType entry above points to. Real table
// elements throughout (Reorder.Group as="tbody", Reorder.Item as="tr"), drag only via the grip handle
// (dragListener={false} + dragControls, same pattern as Pages/Team Dashboard's MemberRow). ──

type DragMember = { id: string; name: string; role: string; status: 'success' | 'warning'; statusLabel: string };

const DRAG_MEMBERS: DragMember[] = [
  { id: '1', name: 'Ana García',   role: 'Design Lead', status: 'success', statusLabel: 'Active'  },
  { id: '2', name: 'Pau Torres',   role: 'Engineer',    status: 'success', statusLabel: 'Active'  },
  { id: '3', name: 'Sara Navarro', role: 'Designer',    status: 'warning', statusLabel: 'Invited' },
];

function DragRow({ member }: { member: DragMember }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item as="tr" value={member} data-helix-part="table-row" dragListener={false} dragControls={dragControls}>
      <TableCell>
        <span
          role="button"
          onPointerDown={e => dragControls.start(e)}
          style={{ cursor: 'grab', display: 'inline-flex', touchAction: 'none' }}
          aria-label={`Reorder ${member.name}`}
        >
          <Icon icon={IconGripVertical} size={16} />
        </span>
      </TableCell>
      <TableCell>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
          <Avatar label={member.name} size="s" />
          {member.name}
        </div>
      </TableCell>
      <TableCell>{member.role}</TableCell>
      <TableCell><Badge variant={member.status} label={member.statusLabel} /></TableCell>
    </Reorder.Item>
  );
}

export const DragReorder: Story = {
  render: () => {
    const [members, setMembers] = useState(DRAG_MEMBERS);
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{''}</TableHeaderCell>
            <TableHeaderCell>Member</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <Reorder.Group as="tbody" axis="y" values={members} onReorder={setMembers} data-helix-part="table-body">
          {members.map(m => <DragRow key={m.id} member={m} />)}
        </Reorder.Group>
      </Table>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Drag any row by its grip handle to reorder. Not a Table prop — real rows composed with Motion\'s Reorder.Group/Reorder.Item (as="tbody"/as="tr"), see the "dragReorder" entry above and .ai/maps/patterns/motion-effects.md.',
      },
    },
  },
};
