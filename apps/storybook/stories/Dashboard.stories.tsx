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
      borderRight: '1px solid var(--helix-color-border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: `var(--helix-primitive-spacing-3) 0`,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--helix-primitive-spacing-2)',
        padding: `var(--helix-primitive-spacing-2) var(--helix-primitive-spacing-3)`,
        marginBottom: 'var(--helix-primitive-spacing-3)',
      }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 'var(--helix-primitive-radius-m)',
          background: 'var(--helix-color-fill-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconBolt size={15} color="var(--helix-color-text-inverse)" stroke={2.5} />
        </div>
        <span style={{
          fontSize: 'var(--helix-primitive-fontSize-m)',
          fontWeight: 'var(--helix-primitive-fontWeight-bold)',
          color: 'var(--helix-color-text-default)',
          letterSpacing: '-0.01em',
        }}>
          Helix DS
        </span>
      </div>

      {/* Label */}
      <div style={{
        fontSize: 'var(--helix-primitive-fontSize-xs)',
        fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
        color: 'var(--helix-color-text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        padding: `0 var(--helix-primitive-spacing-3)`,
        marginBottom: 'var(--helix-primitive-spacing-1)',
      }}>
        Workspace
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, padding: `0 var(--helix-primitive-spacing-2)` }}>
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--helix-primitive-spacing-2)',
              padding: `var(--helix-primitive-spacing-1-5) var(--helix-primitive-spacing-2)`,
              borderRadius: 'var(--helix-primitive-radius-m)',
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--helix-color-fill-primary-subtle)' : 'transparent',
              color: active ? 'var(--helix-color-text-brand)' : 'var(--helix-color-text-secondary)',
              fontWeight: active ? 'var(--helix-primitive-fontWeight-semibold)' : 'var(--helix-primitive-fontWeight-regular)',
              fontSize: 'var(--helix-primitive-fontSize-s)',
              textAlign: 'left',
              width: '100%',
              transition: 'background 100ms',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--helix-color-fill-secondary)'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* User row */}
      <div style={{
        margin: `var(--helix-primitive-spacing-2)`,
        padding: `var(--helix-primitive-spacing-2)`,
        borderRadius: 'var(--helix-primitive-radius-l)',
        borderTop: '1px solid var(--helix-color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--helix-primitive-spacing-2)',
      }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 'var(--helix-primitive-radius-full)',
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
            color: 'var(--helix-color-text-default)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            Marta Conde
          </div>
          <div style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-tertiary)' }}>
            Admin
          </div>
        </div>
        <IconDots size={15} color="var(--helix-color-text-tertiary)" />
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
      border: '1px solid var(--helix-color-border-subtle)',
      borderRadius: 'var(--helix-card-radius)',
      padding: `var(--helix-primitive-spacing-4) var(--helix-primitive-spacing-5)`,
    }}>
      <div style={{
        fontSize: 'var(--helix-primitive-fontSize-xs)',
        fontWeight: 'var(--helix-primitive-fontWeight-medium)',
        color: 'var(--helix-color-text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 'var(--helix-primitive-spacing-2)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--helix-primitive-fontSize-3xl)',
        fontWeight: 'var(--helix-primitive-fontWeight-bold)',
        color: 'var(--helix-color-text-default)',
        lineHeight: 1,
        marginBottom: 'var(--helix-primitive-spacing-2)',
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-1)' }}>
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

// ── Trend chip ─────────────────────────────────────────────────────────────

function TrendChip({ value }: { value: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: `2px var(--helix-primitive-spacing-2)`,
      borderRadius: 'var(--helix-primitive-radius-full)',
      background: 'var(--helix-color-fill-success-subtle)',
    }}>
      <IconTrendingUp size={11} color="var(--helix-color-text-success)" />
      <span style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-success)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>
        {value}
      </span>
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
          gap: 'var(--helix-primitive-spacing-3)',
          padding: `0 var(--helix-primitive-spacing-6)`,
          height: 56,
          flexShrink: 0,
          background: 'var(--helix-color-fill-page)',
          borderBottom: '1px solid var(--helix-color-border-subtle)',
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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-1)' }}>
            <button style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--helix-primitive-radius-m)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--helix-color-text-secondary)',
            }}>
              <IconBell size={17} />
            </button>
            <button style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--helix-primitive-radius-m)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--helix-color-text-secondary)',
            }}>
              <IconHelp size={17} />
            </button>
            <div style={{
              width: 28, height: 28,
              borderRadius: 'var(--helix-primitive-radius-full)',
              background: 'var(--helix-color-fill-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--helix-primitive-fontSize-xs)',
              fontWeight: 'var(--helix-primitive-fontWeight-bold)',
              color: 'var(--helix-color-text-inverse)',
              marginLeft: 'var(--helix-primitive-spacing-1)',
              cursor: 'pointer',
            }}>
              MC
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--helix-spacing-layout-s)',
        }}>

          {/* Page header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--helix-spacing-component-xl)',
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 'var(--helix-primitive-fontSize-2xl)',
                fontWeight: 'var(--helix-primitive-fontWeight-bold)',
                color: 'var(--helix-color-text-default)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}>
                Team
              </h1>
              <p style={{
                margin: `var(--helix-primitive-spacing-1) 0 0`,
                fontSize: 'var(--helix-primitive-fontSize-s)',
                color: 'var(--helix-color-text-secondary)',
              }}>
                Manage members and their access to the Helix workspace.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-2)', alignItems: 'center' }}>
              <TrendChip value="+2 this month" />
              <Button variant="primary" size="s" icon={<IconPlus size={14} />}>
                Invite member
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div style={{
            display: 'flex',
            gap: 'var(--helix-spacing-component-m)',
            flexWrap: 'wrap',
            marginBottom: 'var(--helix-spacing-component-xl)',
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
            padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)`,
            marginBottom: 'var(--helix-spacing-component-m)',
            background: aiCtx ? 'var(--helix-color-fill-primary-subtle)' : 'var(--helix-color-fill-page)',
            border: '1px solid',
            borderColor: aiCtx ? 'var(--helix-color-fill-primary)' : 'var(--helix-color-border-default)',
            borderRadius: 'var(--helix-card-radius)',
            transition: 'background 200ms, border-color 200ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-3)' }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 'var(--helix-primitive-radius-l)',
                background: aiCtx ? 'var(--helix-color-fill-primary)' : 'var(--helix-color-fill-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IconBolt size={15} color={aiCtx ? 'var(--helix-color-text-inverse)' : 'var(--helix-color-text-tertiary)'} />
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--helix-primitive-fontSize-s)',
                  fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
                  color: 'var(--helix-color-text-default)',
                }}>
                  AI Context export
                </div>
                <div style={{ fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-secondary)' }}>
                  Include team structure in <code style={{ fontFamily: 'monospace', fontSize: 'inherit' }}>llms.txt</code>
                </div>
              </div>
            </div>
            <Switch label="" checked={aiCtx} onChange={setAiCtx} />
          </div>

          {/* Table card */}
          <div style={{
            background: 'var(--helix-color-fill-page)',
            border: '1px solid var(--helix-color-border-subtle)',
            borderRadius: 'var(--helix-card-radius)',
            overflow: 'hidden',
          }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--helix-primitive-spacing-2)',
              padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)`,
              borderBottom: '1px solid var(--helix-color-border-subtle)',
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
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-2)' }}>
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
                        padding: `var(--helix-primitive-spacing-2-5) var(--helix-primitive-spacing-4)`,
                        textAlign: 'left',
                        fontSize: 'var(--helix-primitive-fontSize-xs)',
                        fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
                        color: 'var(--helix-color-text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid var(--helix-color-border-subtle)',
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
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--helix-color-border-subtle)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--helix-color-fill-secondary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      {/* Member */}
                      <td style={{ padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-2-5)' }}>
                          <div style={{
                            width: 30, height: 30,
                            borderRadius: 'var(--helix-primitive-radius-full)',
                            background: 'var(--helix-color-fill-primary-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--helix-primitive-fontSize-xs)',
                            fontWeight: 'var(--helix-primitive-fontWeight-bold)',
                            color: 'var(--helix-color-text-brand)',
                            flexShrink: 0,
                          }}>
                            {m.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div style={{
                              fontSize: 'var(--helix-primitive-fontSize-s)',
                              fontWeight: 'var(--helix-primitive-fontWeight-medium)',
                              color: 'var(--helix-color-text-default)',
                              whiteSpace: 'nowrap',
                            }}>
                              {m.name}
                            </div>
                            <div style={{
                              fontSize: 'var(--helix-primitive-fontSize-xs)',
                              color: 'var(--helix-color-text-tertiary)',
                            }}>
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td style={{ padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)`, fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-secondary)', whiteSpace: 'nowrap' }}>
                        {m.role}
                      </td>
                      {/* Status */}
                      <td style={{ padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)` }}>
                        <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
                      </td>
                      {/* Components */}
                      <td style={{ padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)`, fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-default)', fontVariantNumeric: 'tabular-nums' }}>
                        {m.components}
                      </td>
                      {/* Last seen */}
                      <td style={{ padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)`, fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-tertiary)', whiteSpace: 'nowrap' }}>
                        {m.lastSeen}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: `var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)` }}>
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
