import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, Input, Select, Badge, Switch } from '@helix-ds/core';
import {
  IconLayoutDashboard, IconComponents, IconPalette, IconSettings,
  IconBell, IconSearch, IconUsers, IconCode, IconBolt,
  IconTrendingUp, IconArrowUpRight, IconArrowDownRight,
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
  { icon: IconLayoutDashboard, label: 'Dashboard',  active: false },
  { icon: IconComponents,      label: 'Components', active: false },
  { icon: IconPalette,         label: 'Tokens',     active: false },
  { icon: IconUsers,           label: 'Team',       active: true  },
  { icon: IconCode,            label: 'AI Context', active: false },
  { icon: IconSettings,        label: 'Settings',   active: false },
];

// ── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <nav style={{
      width: 224,
      flexShrink: 0,
      background: 'var(--helix-color-fill-page)',
      borderRight: '1px solid var(--helix-color-border-neutral-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: `var(--helix-primitive-spacing-75) 0`,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--helix-primitive-spacing-50)',
        padding: `var(--helix-primitive-spacing-50) var(--helix-primitive-spacing-75)`,
        marginBottom: 'var(--helix-primitive-spacing-75)',
      }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 'var(--helix-radius-m)',
          background: 'var(--helix-color-fill-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconBolt size={15} color="var(--helix-color-text-inverse)" stroke={2.5} />
        </div>
        <span style={{
          fontSize: 'var(--helix-primitive-fontSize-m)',
          fontWeight: 'var(--helix-primitive-fontWeight-bold)',
          color: 'var(--helix-color-text-neutral)',
          letterSpacing: '-0.01em',
        }}>
          Helix DS
        </span>
      </div>

      {/* Label */}
      <div style={{
        fontSize: 'var(--helix-primitive-fontSize-xs)',
        fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
        color: 'var(--helix-color-text-neutral-lightest)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        padding: `0 var(--helix-primitive-spacing-75)`,
        marginBottom: 'var(--helix-primitive-spacing-25)',
      }}>
        Workspace
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, padding: `0 var(--helix-primitive-spacing-50)` }}>
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <Button
            key={label}
            variant={active ? 'primary' : 'ghost'}
            size="s"
            icon={<Icon size={16} />}
            style={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              width: '100%',
              paddingInline: 'var(--helix-primitive-spacing-50)',
            }}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* User row */}
      <div style={{
        margin: `var(--helix-primitive-spacing-50)`,
        padding: `var(--helix-primitive-spacing-50)`,
        borderRadius: 'var(--helix-radius-l)',
        borderTop: '1px solid var(--helix-color-border-neutral-light)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--helix-primitive-spacing-50)',
      }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 'var(--helix-radius-full)',
          background: 'var(--helix-color-fill-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--helix-primitive-fontSize-xs)',
          fontWeight: 'var(--helix-primitive-fontWeight-bold)',
          color: 'var(--helix-color-text-inverse)',
          flexShrink: 0,
        }}>
          MC
        </div>
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
        <Button variant="ghost" size="s" icon={<IconDots size={15} />} style={{ marginLeft: 'auto' }} />
      </div>
    </nav>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, up }: { label: string; value: string; delta: string; up: boolean }) {
  const Icon = up ? IconArrowUpRight : IconArrowDownRight;
  return (
    <div style={{
      flex: '1 1 160px',
      background: 'var(--helix-color-fill-page)',
      border: '1px solid var(--helix-color-border-neutral-light)',
      borderRadius: 'var(--helix-card-radius)',
      padding: `var(--helix-primitive-spacing-100) var(--helix-primitive-spacing-125)`,
    }}>
      <div style={{
        fontSize: 'var(--helix-primitive-fontSize-xs)',
        fontWeight: 'var(--helix-primitive-fontWeight-medium)',
        color: 'var(--helix-color-text-neutral-lightest)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 'var(--helix-primitive-spacing-50)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--helix-primitive-fontSize-3xl)',
        fontWeight: 'var(--helix-primitive-fontWeight-bold)',
        color: 'var(--helix-color-text-neutral)',
        lineHeight: 1,
        marginBottom: 'var(--helix-primitive-spacing-50)',
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-25)' }}>
        <Icon size={13} color={up ? 'var(--helix-color-text-success)' : 'var(--helix-color-text-danger)'} />
        <span style={{
          fontSize: 'var(--helix-primitive-fontSize-xs)',
          color: up ? 'var(--helix-color-text-success)' : 'var(--helix-color-text-danger)',
        }}>
          {delta} vs last month
        </span>
      </div>
    </div>
  );
}

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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--helix-color-fill-page)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--helix-primitive-spacing-75)',
          padding: `0 var(--helix-primitive-spacing-150)`,
          height: 56,
          flexShrink: 0,
          background: 'var(--helix-color-fill-page)',
          borderBottom: '1px solid var(--helix-color-border-neutral-light)',
        }}>
          <div style={{ flex: 1, maxWidth: 320 }}>
            <Input
              label="Search"
              hideLabel
              icon={<IconSearch size={14} />}
              placeholder="Search members…"
              size="s"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-25)' }}>
            <Button variant="ghost" size="s" icon={<IconBell size={17} />} aria-label="Notifications" />
            <Button variant="ghost" size="s" icon={<IconHelp size={17} />} aria-label="Help" />
            <Button variant="primary" size="s" style={{ marginLeft: 'var(--helix-primitive-spacing-25)' }}>
              MC
            </Button>
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--helix-spacing-l)',
        }}>

          {/* Page header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--helix-spacing-l)',
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 'var(--helix-primitive-fontSize-2xl)',
                fontWeight: 'var(--helix-primitive-fontWeight-bold)',
                color: 'var(--helix-color-text-neutral)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}>
                Team
              </h1>
              <p style={{
                margin: `var(--helix-primitive-spacing-25) 0 0`,
                fontSize: 'var(--helix-primitive-fontSize-s)',
                color: 'var(--helix-color-text-neutral-light)',
              }}>
                Manage members and their access to the Helix workspace.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-50)', alignItems: 'center' }}>
              <Badge variant="success" icon={<IconTrendingUp size={11} />} label="+2 this month" />
              <Button variant="primary" size="s" icon={<IconPlus size={14} />}>
                Invite member
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div style={{
            display: 'flex',
            gap: 'var(--helix-spacing-s)',
            flexWrap: 'wrap',
            marginBottom: 'var(--helix-spacing-l)',
          }}>
            <KpiCard label="Members"        value="6"    delta="+2"    up />
            <KpiCard label="Active"         value="4"    delta="+1"    up />
            <KpiCard label="Components"     value="103"  delta="+14"   up />
            <KpiCard label="Token coverage" value="89%"  delta="-2pp"  up={false} />
          </div>

          {/* AI context banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)`,
            marginBottom: 'var(--helix-spacing-s)',
            background: aiCtx ? 'var(--helix-color-fill-primary-light)' : 'var(--helix-color-fill-page)',
            border: '1px solid',
            borderColor: aiCtx ? 'var(--helix-color-fill-primary)' : 'var(--helix-color-border-neutral)',
            borderRadius: 'var(--helix-card-radius)',
            transition: 'background 200ms, border-color 200ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-75)' }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 'var(--helix-radius-l)',
                background: aiCtx ? 'var(--helix-color-fill-primary)' : 'var(--helix-color-fill-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IconBolt size={15} color={aiCtx ? 'var(--helix-color-text-inverse)' : 'var(--helix-color-text-neutral-lightest)'} />
              </div>
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
            <Switch label="" checked={aiCtx} onChange={setAiCtx} />
          </div>

          {/* Table card */}
          <div style={{
            background: 'var(--helix-color-fill-page)',
            border: '1px solid var(--helix-color-border-neutral-light)',
            borderRadius: 'var(--helix-card-radius)',
            overflow: 'hidden',
          }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--helix-primitive-spacing-50)',
              padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)`,
              borderBottom: '1px solid var(--helix-color-border-neutral-light)',
              flexWrap: 'wrap',
            }}>
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
                <Badge variant="neutral">{filtered.length} members</Badge>
                <Button variant="secondary" size="s" icon={<IconFilter size={13} />}>Filter</Button>
                <Button variant="ghost"     size="s" icon={<IconDownload size={13} />}>Export</Button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Member', 'Role', 'Status', 'Components', 'Last seen', ''].map(h => (
                      <th key={h} style={{
                        padding: `var(--helix-primitive-spacing-62-5) var(--helix-primitive-spacing-100)`,
                        textAlign: 'left',
                        fontSize: 'var(--helix-primitive-fontSize-xs)',
                        fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
                        color: 'var(--helix-color-text-neutral-lightest)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid var(--helix-color-border-neutral-light)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr
                      key={m.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--helix-color-fill-secondary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      {/* Member */}
                      <td style={{ padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-62-5)' }}>
                          <div style={{
                            width: 30, height: 30,
                            borderRadius: 'var(--helix-radius-full)',
                            background: 'var(--helix-color-fill-primary-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--helix-primitive-fontSize-xs)',
                            fontWeight: 'var(--helix-primitive-fontWeight-bold)',
                            color: 'var(--helix-color-text-primary)',
                            flexShrink: 0,
                          }}>
                            {m.name.split(' ').map(n => n[0]).join('')}
                          </div>
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
                      </td>
                      {/* Role */}
                      <td style={{ padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)`, fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-light)', whiteSpace: 'nowrap' }}>
                        {m.role}
                      </td>
                      {/* Status */}
                      <td style={{ padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)` }}>
                        <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
                      </td>
                      {/* Components */}
                      <td style={{ padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)`, fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral)', fontVariantNumeric: 'tabular-nums' }}>
                        {m.components}
                      </td>
                      {/* Last seen */}
                      <td style={{ padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)`, fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-lightest)', whiteSpace: 'nowrap' }}>
                        {m.lastSeen}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: `var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)` }}>
                        <Button variant="ghost" size="s">···</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
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
        story: 'Full admin dashboard — sidebar nav, KPI cards, AI context toggle, and a filterable member table. Uses Button, Input, Select, Badge, and Switch from Helix.',
      },
    },
  },
};
