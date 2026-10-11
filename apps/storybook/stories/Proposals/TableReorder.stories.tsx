import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { IconArrowDown, IconArrowUp, IconDots, IconGripVertical } from '@tabler/icons-react';
import { Avatar, Badge, Icon, IconButton, Menu, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@helixds/react';

// PROPOSALS — not part of Helix yet. Four ways to make Table's drag-to-reorder pattern work without dragging
// (WCAG 2.5.7) and from the keyboard (2.1.1), to try out before one is chosen. Every option keeps drag with the
// pointer, keeps focus on the row that moved, and announces the new position to screen readers.

type Member = { id: string; name: string; role: string; status: 'success' | 'warning'; statusLabel: string };
const MEMBERS: Member[] = [
  { id: '1', name: 'Ana García', role: 'Design Lead', status: 'success', statusLabel: 'Active' },
  { id: '2', name: 'Pau Torres', role: 'Engineer', status: 'success', statusLabel: 'Active' },
  { id: '3', name: 'Sara Navarro', role: 'Designer', status: 'warning', statusLabel: 'Invited' },
  { id: '4', name: 'Leo Martín', role: 'Researcher', status: 'success', statusLabel: 'Active' },
];

// Visually hidden but read by screen readers (the standard technique — not a design value).
const srOnly: React.CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

/** Order state + the moves every option shares, the polite announcement, and where focus goes after a move. */
function useReorderable() {
  const [members, setMembers] = useState(MEMBERS);
  const [message, setMessage] = useState('');
  const [focusAfter, setFocusAfter] = useState<string | null>(null);
  useEffect(() => {
    // Moving a row moves its DOM node, which drops focus — put it back on the same control of the moved row.
    if (!focusAfter) return;
    document.querySelector<HTMLElement>(`[data-reorder-focus="${focusAfter}"]`)?.focus();
    setFocusAfter(null);
  }, [focusAfter, members]);
  const move = (id: string, to: number, focusKey?: string) => {
    setMembers(list => {
      const from = list.findIndex(m => m.id === id);
      const target = Math.max(0, Math.min(list.length - 1, to));
      if (from === target) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(target, 0, item!);
      setMessage(`${item!.name} moved to position ${target + 1} of ${list.length}.`);
      return next;
    });
    if (focusKey) setFocusAfter(focusKey);
  };
  return { members, setMembers, move, message, setMessage, setFocusAfter };
}

type Shared = ReturnType<typeof useReorderable>;

// ── Option A: the grip itself works with the keyboard ───────────────────────
function KeyboardGrip({ member, index, total, r }: { member: Member; index: number; total: number; r: Shared & { grabbed: string | null; setGrabbed: (id: string | null) => void; snapshot: React.MutableRefObject<Member[] | null> } }) {
  const isGrabbed = r.grabbed === member.id;
  return (
    <IconButton
      icon={IconGripVertical}
      label={`Reorder ${member.name}`}
      variant="ghost"
      size="s"
      aria-pressed={isGrabbed}
      aria-describedby="reorder-instructions"
      data-reorder-focus={`grip-${member.id}`}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!isGrabbed && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          r.snapshot.current = r.members;
          r.setGrabbed(member.id);
          r.setMessage(`${member.name} grabbed. Position ${index + 1} of ${total}. Arrow keys to move, Space to drop, Escape to cancel.`);
        } else if (isGrabbed && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          r.move(member.id, index + (e.key === 'ArrowUp' ? -1 : 1), `grip-${member.id}`);
        } else if (isGrabbed && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          r.setGrabbed(null);
          r.setMessage(`${member.name} dropped at position ${index + 1} of ${total}.`);
        } else if (isGrabbed && e.key === 'Escape') {
          e.preventDefault();
          if (r.snapshot.current) r.setMembers(r.snapshot.current);
          r.setGrabbed(null);
          r.setFocusAfter(`grip-${member.id}`);
          r.setMessage(`Reorder cancelled. ${member.name} is back where it was.`);
        }
      }}
      onBlur={() => { if (isGrabbed) { r.setGrabbed(null); } }}
    />
  );
}

// ── Option B: visible Move up / Move down buttons ──────────────────────────
function UpDown({ member, index, total, r }: { member: Member; index: number; total: number; r: Shared }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-25)' }}>
      <IconButton icon={IconArrowUp} label={`Move ${member.name} up`} variant="ghost" size="s" disabled={index === 0}
        data-reorder-focus={`up-${member.id}`}
        onClick={() => r.move(member.id, index - 1, index - 1 === 0 ? `down-${member.id}` : `up-${member.id}`)} />
      <IconButton icon={IconArrowDown} label={`Move ${member.name} down`} variant="ghost" size="s" disabled={index === total - 1}
        data-reorder-focus={`down-${member.id}`}
        onClick={() => r.move(member.id, index + 1, index + 1 === total - 1 ? `up-${member.id}` : `down-${member.id}`)} />
    </div>
  );
}

// ── Option C: a row-actions menu (Helix Menu, select-only pattern on the trigger) ──
function RowMenu({ member, index, total, r }: { member: Member; index: number; total: number; r: Shared }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | undefined>();
  const ref = useRef<HTMLButtonElement>(null);
  const menuId = `row-menu-${member.id}`;
  const options = [
    { value: 'top', label: 'Move to top', disabled: index === 0 },
    { value: 'up', label: 'Move up', disabled: index === 0 },
    { value: 'down', label: 'Move down', disabled: index === total - 1 },
    { value: 'bottom', label: 'Move to bottom', disabled: index === total - 1 },
  ];
  const enabled = options.filter(o => !o.disabled).map(o => o.value);
  const pick = (v: string) => {
    setOpen(false); setActive(undefined);
    const to = v === 'top' ? 0 : v === 'up' ? index - 1 : v === 'down' ? index + 1 : total - 1;
    r.move(member.id, to, `menu-${member.id}`);
  };
  const step = (d: number) => { const i = active ? enabled.indexOf(active) : -1; setActive(enabled[(i + d + enabled.length) % enabled.length]); };
  return (
    <>
      <IconButton ref={ref} icon={IconDots} label={`Actions for ${member.name}`} variant="ghost" size="s"
        data-reorder-focus={`menu-${member.id}`}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId}
        aria-activedescendant={open && active ? `${menuId}-option-${active}` : undefined}
        onClick={() => { setOpen(o => !o); setActive(enabled[0]); }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setOpen(true); setActive(enabled[e.key === 'ArrowDown' ? 0 : enabled.length - 1]); }
          else if (open && e.key === 'ArrowDown') { e.preventDefault(); step(1); }
          else if (open && e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
          else if (open && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (active) pick(active); }
          else if (open && e.key === 'Escape') { e.preventDefault(); setOpen(false); }
          else if (open && e.key === 'Tab') setOpen(false);
        }} />
      <Menu id={menuId} expanded={open} anchorRef={ref} options={options} {...(active ? { activeValue: active } : {})} onSelect={pick} />
    </>
  );
}

function Row({ member, index, total, keyboardGrip, controls }: { member: Member; index: number; total: number; keyboardGrip?: React.ReactNode; controls?: React.ReactNode }) {
  const drag = useDragControls();
  return (
    <Reorder.Item as="tr" value={member} data-helix-part="table-row" dragListener={false} dragControls={drag}>
      <TableCell>
        <span onPointerDown={e => { e.preventDefault(); drag.start(e); }} style={{ cursor: 'grab', display: 'inline-flex', touchAction: 'none' }}>
          {/* Without option A the grip is pointer-only and hidden from assistive tech (its alternative is the controls column). */}
          {keyboardGrip ?? <span aria-hidden="true"><Icon icon={IconGripVertical} size={16} /></span>}
        </span>
      </TableCell>
      <TableCell>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
          <Avatar label={member.name} size="s" />{member.name}
        </div>
      </TableCell>
      <TableCell>{member.role}</TableCell>
      <TableCell><Badge variant={member.status} label={member.statusLabel} /></TableCell>
      {controls !== undefined ? <TableCell>{controls}</TableCell> : null}
    </Reorder.Item>
  );
}

function Proposal({ grip, controls, controlsLabel }: { grip: boolean; controls?: 'updown' | 'menu'; controlsLabel?: string }) {
  const r = useReorderable();
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const snapshot = useRef<Member[] | null>(null);
  const rg = { ...r, grabbed, setGrabbed, snapshot };
  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell><span style={srOnly}>Reorder</span></TableHeaderCell>
            <TableHeaderCell>Member</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            {controls ? <TableHeaderCell>{controlsLabel}</TableHeaderCell> : null}
          </TableRow>
        </TableHead>
        <Reorder.Group as="tbody" axis="y" values={r.members} onReorder={r.setMembers} data-helix-part="table-body">
          {r.members.map((m, i) => (
            <Row key={m.id} member={m} index={i} total={r.members.length}
              keyboardGrip={grip ? <KeyboardGrip member={m} index={i} total={r.members.length} r={rg} /> : undefined}
              controls={controls === 'updown' ? <UpDown member={m} index={i} total={r.members.length} r={r} />
                : controls === 'menu' ? <RowMenu member={m} index={i} total={r.members.length} r={r} /> : undefined} />
          ))}
        </Reorder.Group>
      </Table>
      {grip ? <span id="reorder-instructions" style={srOnly}>Press Space to pick up the row, arrow keys to move it, Space to drop, Escape to cancel.</span> : null}
      <div role="status" aria-live="polite" style={srOnly}>{r.message}</div>
    </div>
  );
}

const meta: Meta = { title: 'Proposals/Table reorder', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

export const A_KeyboardGrip: Story = {
  name: 'A · Grip works with the keyboard',
  render: () => <Proposal grip />,
  parameters: { docs: { description: { story: 'Tab to a grip ⋮⋮, Space to pick the row up, ↑/↓ to move it, Space to drop, Escape to cancel. Keyboard only — on its own it does NOT meet 2.5.7 (no way to reorder with clicks without dragging).' } } },
};
export const B_UpDownButtons: Story = {
  name: 'B · Move up / Move down buttons',
  render: () => <Proposal grip={false} controls="updown" controlsLabel="Order" />,
  parameters: { docs: { description: { story: 'Two ghost IconButtons per row. Work with a click and with the keyboard; disabled at the ends. Meets 2.1.1 and 2.5.7.' } } },
};
export const C_RowMenu: Story = {
  name: 'C · Row actions menu',
  render: () => <Proposal grip={false} controls="menu" controlsLabel="Actions" />,
  parameters: { docs: { description: { story: '⋯ opens Helix Menu: Move to top / up / down / to bottom. Click, or ↓ to open, ↑/↓ to choose, Enter to apply, Escape to close. Meets 2.1.1 and 2.5.7.' } } },
};
export const CA_MenuAndKeyboardGrip: Story = {
  name: 'C + A · Menu and keyboard grip (recommended)',
  render: () => <Proposal grip controls="menu" controlsLabel="Actions" />,
  parameters: { docs: { description: { story: 'The menu for everyone, plus the keyboard grip as a shortcut. Meets 2.1.1 and 2.5.7.' } } },
};
