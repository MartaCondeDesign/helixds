import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  AppShell, SideNav, NavItem, TopBar, PageHeader, StatCard, Card, Avatar, Icon,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  Button, Input, Select, Badge, Switch,
} from '@helix-ds/core';
import {
  IconLayoutDashboard, IconComponents, IconPalette, IconSettings,
  IconBell, IconSearch, IconUsers, IconCode, IconBolt, IconTrendingUp,
  IconFilter, IconDownload, IconPlus, IconDots, IconHelp,
} from '@tabler/icons-react';

// ── Types ──────────────────────────────────────────────────────────────────

type Member = {
  id: string; name: string; email: string; role: string;
  status: 'active' | 'invited' | 'suspended';
  components: number; lastSeen: string;
};

const MEMBERS: Member[] = [
  { id: '1', name: 'Ana García',   email: 'ana@company.com',   role: 'Design Lead',    status: 'active',    components: 24, lastSeen: '2 min ago' },
  { id: '2', name: 'Pau Torres',   email: 'pau@company.com',   role: 'Engineer',       status: 'active',    components: 18, lastSeen: '1 hr ago'  },
  { id: '3', name: 'Marta Conde',  email: 'marta@company.com', role: 'DS Specialist',  status: 'active',    components: 47, lastSeen: 'Just now'  },
  { id: '4', name: 'Jordi Puig',   email: 'jordi@company.com', role: 'Frontend',       status: 'active',    components: 11, lastSeen: '3 hrs ago' },
  { id: '5', name: 'Sara Navarro', email: 'sara@new.com',      role: 'Designer',       status: 'invited',   components: 0,  lastSeen: '—'         },
  { id: '6', name: 'Alex Romero',  email: 'alex@company.com',  role: 'Product Manager',status: 'suspended', components: 3,  lastSeen: '2 days ago'},
];

const STATUS_VARIANT: Record<Member['status'], 'success' | 'warning' | 'danger'> = {
  active: 'success', invited: 'warning', suspended: 'danger',
};

const NAV_ITEMS = [
  { icon: IconLayoutDashboard, label: 'Dashboard',  href: '#' },
  { icon: IconComponents,      label: 'Components', href: '#' },
  { icon: IconPalette,         label: 'Tokens',      href: '#' },
  { icon: IconUsers,           label: 'Team',        href: '#', current: true },
  { icon: IconCode,            label: 'AI Context',  href: '#' },
  { icon: IconSettings,        label: 'Settings',    href: '#' },
];

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)' }}>
              <span style={{
                width: 28, height: 28, borderRadius: 'var(--helix-radius-m)',
                background: 'var(--helix-color-fill-primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon icon={IconBolt} size={16} stroke={2.5} color="var(--helix-color-text-inverse)" />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)' }}>
              <Avatar label="Marta Conde" variant="solid" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 'var(--helix-primitive-fontSize-s)',
                  fontWeight: 'var(--helix-primitive-fontWeight-medium)',
                  color: 'var(--helix-color-text-neutral)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  Marta Conde
                </div>
                <div style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-lightest)' }}>
                  Admin
                </div>
              </div>
              <Button variant="ghost" size="s" icon={IconDots} aria-label="Account menu" />
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
              <Button variant="ghost" size="s" icon={IconBell} aria-label="Notifications" />
              <Button variant="ghost" size="s" icon={IconHelp} aria-label="Help" />
              <Avatar label="Marta Conde" variant="solid" size="s" />
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
            <Button variant="primary" size="s" icon={IconPlus}>Invite member</Button>
          </>
        }
      />

      {/* KPIs */}
      <div style={{
        display: 'flex',
        gap: 'var(--helix-spacing-s)',
        flexWrap: 'wrap',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
              <span style={{
                width: 32, height: 32, borderRadius: 'var(--helix-radius-l)',
                background: aiCtx ? 'var(--helix-color-fill-primary)' : 'var(--helix-color-fill-secondary-interactive-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon
                  icon={IconBolt}
                  size={16}
                  color={aiCtx ? 'var(--helix-color-text-inverse)' : 'var(--helix-color-text-neutral-lightest)'}
                />
              </span>
              <div>
                <div style={{
                  fontSize: 'var(--helix-primitive-fontSize-s)',
                  fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
                  color: 'var(--helix-color-text-neutral)',
                }}>
                  AI Context export
                </div>
                <div style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-light)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)', flexWrap: 'wrap' }}>
            <div style={{ width: 200 }}>
              <Select
                label="Role"
                hideLabel
                options={roles}
                placeholder="All roles"
                value={role}
                onChange={setRole}
                size="s"
              />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-50)' }}>
              <Badge variant="neutral" label={`${filtered.length} members`} />
              <Button variant="secondary" size="s" icon={IconFilter}>Filter</Button>
              <Button variant="ghost"     size="s" icon={IconDownload}>Export</Button>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
                    <Avatar label={m.name} size="s" />
                    <div>
                      <div style={{
                        fontSize: 'var(--helix-primitive-fontSize-s)',
                        fontWeight: 'var(--helix-primitive-fontWeight-medium)',
                        color: 'var(--helix-color-text-neutral)',
                        whiteSpace: 'nowrap',
                      }}>
                        {m.name}
                      </div>
                      <div style={{
                        fontSize: 'var(--helix-primitive-fontSize-xs)',
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
                <TableCell><Button variant="ghost" size="s" aria-label="Row actions">···</Button></TableCell>
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
        story: 'Full admin dashboard, built entirely from Helix DS components — AppShell, SideNav, NavItem, TopBar, PageHeader, StatCard, Card, Avatar, Table, Badge, Button, Input, Select, Switch, Icon.',
      },
    },
  },
};
