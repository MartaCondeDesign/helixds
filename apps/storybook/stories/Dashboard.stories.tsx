import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import {
  AppShell, SideNav, NavItem, TopBar, PageHeader, Card, Avatar, Icon, Select, FAB,
  Table, TableHead, TableHeaderCell, TableCell,
  Button, IconButton, Input, Badge,
} from '@helix-ds/core';
import {
  IconBell, IconSearch, IconBolt,
  IconDownload, IconPlus, IconDots, IconHelp,
  IconArrowUpRight, IconArrowDownRight,
  IconTable, IconLayoutGrid, IconGripVertical, IconUserPlus,
} from '@tabler/icons-react';
import { MEMBERS, NAV_ITEMS } from './fixtures/dashboard.fixture';
import type { Member } from './fixtures/dashboard.fixture';

// ── Stat Card pattern — Card composed with a fixed label/value/delta layout, not its own
// component. See .ai/maps/patterns/stat-card.md / Patterns → StatCard for the canonical recipe. ──

type Trend = 'up' | 'down';

function StatCard({
  label, value, delta, trend,
}: { label: string; value: string; delta?: string; trend?: Trend }) {
  return (
    <Card>
      <div style={{
        // semantic.textStyle.label-uppercase — its token description asks for text-transform +
        // letter-spacing at the call site, so both come from here (letter-spacing from its token).
        fontFamily:     'var(--helix-textStyle-label-uppercase-fontFamily)',
        fontSize:       'var(--helix-textStyle-label-uppercase-fontSize)',
        fontWeight:     'var(--helix-textStyle-label-uppercase-fontWeight)',
        lineHeight:     'var(--helix-textStyle-label-uppercase-lineHeight)',
        textTransform:  'uppercase',
        letterSpacing:  'var(--helix-primitive-letterSpacing-wide)',
        color:          'var(--helix-color-text-neutral-lightest)',
        marginBottom:   'var(--helix-spacing-xs)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:    'var(--helix-textStyle-heading-3xl-bold-fontFamily)',
        fontSize:      'var(--helix-textStyle-heading-3xl-bold-fontSize)',
        fontWeight:    'var(--helix-textStyle-heading-3xl-bold-fontWeight)',
        lineHeight:    'var(--helix-textStyle-heading-3xl-bold-lineHeight)',
        letterSpacing: 'var(--helix-primitive-letterSpacing-tight)',
        color:         'var(--helix-color-text-neutral)',
        fontVariantNumeric: 'tabular-nums',
        marginBottom:  'var(--helix-spacing-xs)',
      }}>
        {value}
      </div>
      {delta && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        'var(--helix-spacing-3xs)', // 2px — arrow and delta read as one unit
          fontSize:   'var(--helix-textStyle-body-s-regular-fontSize)',
          fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
          color: trend === 'up'   ? 'var(--helix-color-text-success)'
               : trend === 'down' ? 'var(--helix-color-text-danger)'
               : 'var(--helix-color-text-neutral-light)',
        }}>
          {trend && (
            <Icon
              icon={trend === 'up' ? IconArrowUpRight : IconArrowDownRight}
              size={12}
              color={trend === 'up' ? 'var(--helix-color-icon-success)' : 'var(--helix-color-icon-danger)'}
            />
          )}
          {delta}
        </div>
      )}
    </Card>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
// MEMBERS/NAV_ITEMS mock data lives in ./fixtures/dashboard.fixture.ts — shared with any future
// test that wants the same demo data, instead of duplicated/hardcoded inline here.

const STATUS_VARIANT: Record<Member['status'], 'success' | 'warning' | 'danger'> = {
  active: 'success', invited: 'warning', suspended: 'danger',
};

const ROLES = Array.from(new Set(MEMBERS.map(m => m.role)));

// One row, its own Reorder.Item — useDragControls is a hook, it needs its own component instance per
// row (can't call it inside a .map() callback directly, that breaks the Rules of Hooks). dragListener is
// off so the row itself isn't draggable by clicking anywhere in it (that would fight the row's own
// interactive content, e.g. "Row actions"); the grip icon starts the drag explicitly via dragControls.
function MemberRow({ member }: { member: Member }) {
  const dragControls = useDragControls();
  const [dragging, setDragging] = useState(false);
  return (
    <Reorder.Item
      as="tr"
      value={member}
      data-helix-part="table-row"
      data-dragging={dragging || undefined}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
    >
      <TableCell>
        <span
          onPointerDown={e => {
            e.preventDefault(); // no text selection starting under the pointer as it crosses rows
            dragControls.start(e);
          }}
          style={{ cursor: 'grab', display: 'inline-flex', touchAction: 'none' }}
          aria-label={`Reorder ${member.name}`}
        >
          <Icon icon={IconGripVertical} size={16} />
        </span>
      </TableCell>
      <TableCell>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
          <Avatar label={member.name} size="s" />
          <div>
            <div style={{
              fontSize: 'var(--helix-textStyle-body-s-medium-fontSize)',
              fontWeight: 'var(--helix-textStyle-body-s-medium-fontWeight)',
              color: 'var(--helix-color-text-neutral)',
              whiteSpace: 'nowrap',
            }}>
              {member.name}
            </div>
            <div style={{
              fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)',
              fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
              color: 'var(--helix-color-text-neutral-lightest)',
            }}>
              {member.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>{member.role}</TableCell>
      <TableCell><Badge variant={STATUS_VARIANT[member.status]} label={member.status} /></TableCell>
      <TableCell>{member.components}</TableCell>
      <TableCell>{member.lastSeen}</TableCell>
      <TableCell><IconButton variant="ghost" size="s" icon={IconDots} label="Row actions" /></TableCell>
    </Reorder.Item>
  );
}

// ── Motion additions (ADR-007) ──────────────────────────────────────────────
// Role filter: the real Select component, single-value — a custom multi-select dropdown panel was tried
// here and reverted, this page only uses real Helix components. Table rows: Motion's native
// Reorder.Group/Reorder.Item (as="tbody"/as="tr" — real table elements, no CSS table box-generation
// issue). Cards view: plain, no drag. FAB: Morph-style speed-dial via Motion springs. Switch: Motion
// spring thumb (in the real Switch component, not here). See .ai/maps/patterns/motion-effects.md for the
// full effect-by-component map.

// ── Main page ──────────────────────────────────────────────────────────────

function DashboardPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [role, setRole] = useState('');
  const [memberOrder, setMemberOrder] = useState<string[]>(MEMBERS.map(m => m.id));

  const orderedMembers = useMemo(
    () => memberOrder.map(id => MEMBERS.find(m => m.id === id)).filter((m): m is Member => !!m),
    [memberOrder],
  );

  const filtered = orderedMembers.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchRole   = !role || m.role === role;
    return matchSearch && matchRole;
  });

  // Motion's Reorder.Group works on the currently VISIBLE (filtered) array; reordering within that
  // subset gets spliced back into the full underlying order, so hidden (filtered-out) members keep their
  // relative position instead of being disturbed by a drag they can't see.
  const handleReorder = (newFilteredOrder: Member[]) => {
    const newIds = newFilteredOrder.map(m => m.id);
    setMemberOrder(order => {
      const filteredIdSet = new Set(newIds);
      let idx = 0;
      return order.map(id => (filteredIdSet.has(id) ? newIds[idx++] : id));
    });
  };

  return (
    <AppShell
      sidenav={
        <SideNav
          brand={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)' }}>
              <span style={{
                width: 28, height: 28, borderRadius: 'var(--helix-radius-m)',
                background: 'var(--helix-color-fill-primary-interactive-light-default)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon icon={IconBolt} size={16} color="var(--helix-color-icon-primary)" />
              </span>
              <span style={{
                fontSize: 'var(--helix-primitive-fontSize-m)',
                fontWeight: 'var(--helix-primitive-fontWeight-bold)',
                color: 'var(--helix-color-text-neutral)',
                letterSpacing: '-0.01em',
              }}>
                Helix DS
              </span>
            </div>
          }
          footer={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)' }}>
              <Avatar label="Marta Conde" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 'var(--helix-textStyle-body-s-medium-fontSize)',
                  fontWeight: 'var(--helix-textStyle-body-s-medium-fontWeight)',
                  color: 'var(--helix-color-text-neutral)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  Marta Conde
                </div>
                <div style={{
                  fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)',
                  fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
                  color: 'var(--helix-color-text-neutral-lightest)',
                }}>
                  Admin
                </div>
              </div>
              <IconButton variant="ghost" size="s" icon={IconDots} label="Account menu" />
            </div>
          }
        >
          {NAV_ITEMS.map(item => <NavItem key={item.label} {...item} />)}
        </SideNav>
      }
      topbar={
        <TopBar
          start={
            <Input
              label="Search"
              hideLabel
              icon={IconSearch}
              placeholder="Search members…"
              size="m"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          }
          end={
            <>
              <IconButton variant="ghost" size="m" icon={IconBell} label="Notifications" />
              <IconButton variant="ghost" size="m" icon={IconHelp} label="Help" />
            </>
          }
        />
      }
    >
      <PageHeader
        label="Team"
        description="Manage members and their access to the Helix workspace."
        actions={
          <Button variant="primary" size="m" icon={IconPlus}>Invite member</Button>
        }
      />

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--helix-spacing-s)',
        margin: 'var(--helix-spacing-l) 0',
      }}>
        <StatCard label="Members"        value="6"    delta="+2"    trend="up" />
        <StatCard label="Active"         value="4"    delta="+1"    trend="up" />
        <StatCard label="Components"     value="103"  delta="+14"   trend="up" />
        <StatCard label="Token coverage" value="89%"  delta="-2pp"  trend="down" />
      </div>

      {/* One row: real Select for the role filter on the left, Export + view toggle pushed to the far
          right (view toggle rightmost). Single-select, matching what Select actually is — no invented
          multi-select panel. */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)', flexWrap: 'wrap', marginBottom: 'var(--helix-spacing-s)' }}
      >
        {/* No width wrapper: Select's own 150px minimum for word options applies (Select contract) */}
        <Select
          label="Role"
          hideLabel
          options={ROLES.map(r => ({ value: r, label: r }))}
          placeholder="All roles"
          value={role}
          onChange={setRole}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)' }}>
          <Button variant="ghost" size="m" icon={IconDownload}>Export</Button>
          {/* View toggle — view-toggle.md recipe */}
          <div role="group" aria-label="View" style={{ display: 'inline-flex', gap: 'var(--helix-primitive-spacing-25)' }}>
            <IconButton
              icon={IconTable}
              label="Table view"
              variant={view === 'table' ? 'secondary' : 'ghost'}
              aria-pressed={view === 'table'}
              onPress={() => setView('table')}
            />
            <IconButton
              icon={IconLayoutGrid}
              label="Cards view"
              variant={view === 'cards' ? 'secondary' : 'ghost'}
              aria-pressed={view === 'cards'}
              onPress={() => setView('cards')}
            />
          </div>
        </div>
      </div>

      {/* Member table/cards — draggable to reorder via Motion's Reorder (ADR-007). Reorder.Item/
          Reorder.Group both take an `as` prop — `tr`/`tbody` render as real table elements, so this
          doesn't hit the CSS table box-generation problem a generic wrapper element would. */}
      {view === 'table' ? (
        <Card padding="none">
          <Table>
            <TableHead>
              <tr data-helix-part="table-row">
                <TableHeaderCell>{''}</TableHeaderCell>
                <TableHeaderCell>Member</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Components</TableHeaderCell>
                <TableHeaderCell>Last seen</TableHeaderCell>
                <TableHeaderCell>{''}</TableHeaderCell>
              </tr>
            </TableHead>
            <Reorder.Group as="tbody" axis="y" values={filtered} onReorder={handleReorder} data-helix-part="table-body">
              {filtered.map(m => <MemberRow key={m.id} member={m} />)}
            </Reorder.Group>
          </Table>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--helix-spacing-m)' }}>
          {filtered.map(m => (
            <Card key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
                <Avatar label={m.name} size="s" />
                <div>
                  <div style={{ fontSize: 'var(--helix-textStyle-body-s-medium-fontSize)', fontWeight: 'var(--helix-textStyle-body-s-medium-fontWeight)' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)', color: 'var(--helix-color-text-neutral-lightest)' }}>
                    {m.role}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 'var(--helix-spacing-s)' }}>
                <Badge variant={STATUS_VARIANT[m.status]} label={m.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 'var(--helix-spacing-l)', right: 'var(--helix-spacing-l)' }}>
        <FAB
          icon={IconUserPlus}
          label="Add"
          actions={[
            { icon: IconUserPlus, label: 'Invite member', onPress: () => {} },
            { icon: IconDownload, label: 'Export list', onPress: () => {} },
          ]}
        />
      </div>
    </AppShell>
  );
}

// ── Story ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Pages/Team Dashboard',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const TeamDashboard: Story = {
  render: () => <DashboardPage />,
  parameters: {
    docs: {
      description: {
        story: 'Full admin dashboard, built from Helix DS components — AppShell, SideNav, NavItem, TopBar, PageHeader, Card (KPI row uses the StatCard pattern, see .ai/maps/patterns/stat-card.md), Avatar, Table, Badge, Button, IconButton, Input, Select, Icon, FAB. Table rows drag-reorder via Motion Reorder (ADR-007); the FAB speed-dial uses Motion springs.',
      },
    },
  },
};
