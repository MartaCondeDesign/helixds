import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  AppShell, SideNav, NavItem, TopBar, PageHeader, Card, Avatar, Icon,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  Button, IconButton, Input, Select, Badge, Switch,
} from '@helix-ds/core';
import {
  IconBell, IconSearch, IconBolt, IconTrendingUp,
  IconFilter, IconDownload, IconPlus, IconDots, IconHelp,
  IconArrowUpRight, IconArrowDownRight,
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
        fontSize:       'var(--helix-textStyle-body-s-medium-fontSize)',
        fontWeight:     'var(--helix-textStyle-body-s-medium-fontWeight)',
        color:          'var(--helix-color-text-neutral-lightest)',
        textTransform:  'uppercase',
        letterSpacing:  '0.05em',
        marginBottom:   'var(--helix-spacing-xs)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:      'var(--helix-textStyle-heading-3xl-bold-fontSize)',
        fontWeight:    'var(--helix-textStyle-heading-3xl-bold-fontWeight)',
        color:         'var(--helix-color-text-neutral)',
        lineHeight:    1,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
        marginBottom:  'var(--helix-spacing-xs)',
      }}>
        {value}
      </div>
      {delta && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        'var(--helix-spacing-xs)',
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
              color={trend === 'up' ? 'var(--helix-color-text-success)' : 'var(--helix-color-text-danger)'}
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

// ── Main page ──────────────────────────────────────────────────────────────

function DashboardPage() {
  const [search, setSearch] = useState('');
  const [role,   setRole]   = useState('');
  const [aiCtx,  setAiCtx]  = useState(true);

  const roles = [
    { value: 'design',   label: 'Design'      },
    { value: 'engineer', label: 'Engineering' },
    { value: 'pm',       label: 'Product'     },
  ];

  const filtered = MEMBERS.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchRole   = !role || m.role.toLowerCase().includes(role);
    return matchSearch && matchRole;
  });

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
                <Icon icon={IconBolt} size={16} stroke={2.5} color="var(--helix-color-text-primary)" />
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
              size="s"
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
          <>
            <Badge variant="success" icon={IconTrendingUp} label="+2 this month" />
            <Button variant="primary" size="m" icon={IconPlus}>Invite member</Button>
          </>
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

      {/* AI context banner */}
      <div style={{ marginBottom: 'var(--helix-spacing-s)' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
              <span style={{
                width: 32, height: 32, borderRadius: 'var(--helix-radius-l)',
                background: aiCtx ? 'var(--helix-color-fill-primary-interactive-light-default)' : 'var(--helix-color-fill-secondary-interactive-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon
                  icon={IconBolt}
                  size={16}
                  color={aiCtx ? 'var(--helix-color-text-primary)' : 'var(--helix-color-text-neutral-lightest)'}
                />
              </span>
              <div>
                <div style={{
                  fontSize: 'var(--helix-textStyle-caption-semibold-fontSize)',
                  fontWeight: 'var(--helix-textStyle-caption-semibold-fontWeight)',
                  color: 'var(--helix-color-text-neutral)',
                }}>
                  AI Context export
                </div>
                <div style={{
                  fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)',
                  fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
                  color: 'var(--helix-color-text-neutral-light)',
                }}>
                  Include team structure in <code style={{ fontFamily: 'monospace', fontSize: 'inherit' }}>llms.txt</code>
                </div>
              </div>
            </div>
            <Switch label="AI Context export" hideLabel checked={aiCtx} onChange={setAiCtx} />
          </div>
        </Card>
      </div>

      {/* Member table */}
      <Card
        padding="none"
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)', flexWrap: 'wrap' }}>
            <div style={{ width: 200 }}>
              <Select
                label="Role"
                hideLabel
                options={roles}
                placeholder="All roles"
                value={role}
                onChange={setRole}
                size="m"
              />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)' }}>
              <Badge variant="neutral" label={`${filtered.length} members`} />
              <Button variant="secondary" size="m" icon={IconFilter}>Filter</Button>
              <Button variant="ghost"     size="m" icon={IconDownload}>Export</Button>
            </div>
          </div>
        }
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Member</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Components</TableHeaderCell>
              <TableHeaderCell>Last seen</TableHeaderCell>
              <TableHeaderCell>{''}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(m => (
              <TableRow key={m.id}>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
                    <Avatar label={m.name} size="s" />
                    <div>
                      <div style={{
                        fontSize: 'var(--helix-textStyle-body-s-medium-fontSize)',
                        fontWeight: 'var(--helix-textStyle-body-s-medium-fontWeight)',
                        color: 'var(--helix-color-text-neutral)',
                        whiteSpace: 'nowrap',
                      }}>
                        {m.name}
                      </div>
                      <div style={{
                        fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)',
                        fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
                        color: 'var(--helix-color-text-neutral-lightest)',
                      }}>
                        {m.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{m.role}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[m.status]} label={m.status} /></TableCell>
                <TableCell>{m.components}</TableCell>
                <TableCell>{m.lastSeen}</TableCell>
                <TableCell><IconButton variant="ghost" size="s" icon={IconDots} label="Row actions" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
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
        story: 'Full admin dashboard, built entirely from Helix DS components — AppShell, SideNav, NavItem, TopBar, PageHeader, Card (KPI row uses the StatCard pattern, see .ai/maps/patterns/stat-card.md), Avatar, Table, Badge, Button, IconButton, Input, Select, Switch, Icon.',
      },
    },
  },
};
