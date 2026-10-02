import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, Input, Badge, Card, Chip } from '@helix-ds/core';
import {
  IconPlus,
  IconUpload,
  IconTrash,
  IconSearch,
  IconX,
  IconFolderOpen,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconInfoCircle,
  IconArrowRight,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-react';

const meta: Meta = {
  title:  'Patterns',
  tags:   ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Design patterns are compositions of multiple Helix components that solve a recurring UI problem.

Each pattern has a machine-readable spec in \`.ai/maps/patterns/\`.
Agents should read the pattern file before building that UI to avoid anti-patterns.

| Pattern | File |
|---------|------|
| Empty State | \`.ai/maps/patterns/empty-state.md\` |
| Form Field Group | \`.ai/maps/patterns/form-field-group.md\` |
| Action Bar | \`.ai/maps/patterns/action-bar.md\` |
| Status Row | \`.ai/maps/patterns/status-row.md\` |
| Search + Filter | \`.ai/maps/patterns/search-filter.md\` |
| Stat Card | \`.ai/maps/patterns/stat-card.md\` |
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/* ════════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════════════════ */

export const EmptyState: Story = {
  render: () => (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            'var(--helix-primitive-spacing-100)',
      padding:        'var(--helix-primitive-spacing-300)',
      textAlign:      'center',
      background:     'var(--helix-color-fill-surface)',
      borderRadius:   'var(--helix-radius-xl)',
      border:         '1px dashed var(--helix-color-border-neutral)',
      maxWidth:       '420px',
    }}>
      <span style={{ color: 'var(--helix-color-text-neutral-light)' }} aria-hidden="true">
        <IconFolderOpen size={48} />
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-50)' }}>
        <h3 style={{
          fontSize:   'var(--helix-primitive-fontSize-xl)',
          fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
          color:      'var(--helix-color-text-neutral)',
          margin: 0,
        }}>
          No projects yet
        </h3>
        <p style={{
          fontSize:  'var(--helix-primitive-fontSize-s)',
          color:     'var(--helix-color-text-neutral-light)',
          maxWidth:  '280px',
          margin:    0,
          lineHeight: 'var(--helix-primitive-lineHeight-relaxed)',
        }}>
          Create your first project to get started. Projects help you organize your work.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)' }}>
        <Button variant="secondary" icon={IconUpload}>Import</Button>
        <Button variant="primary"   icon={IconPlus}>New project</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: '**Pattern: Empty State** — `.ai/maps/patterns/empty-state.md`. Use when a list/table has zero items.' },
    },
  },
};

/* ════════════════════════════════════════════════════════════════════════════
   ACTION BAR
   ════════════════════════════════════════════════════════════════════════════ */

export const ActionBarPageHeader: Story = {
  render: () => (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        'var(--helix-primitive-spacing-100) var(--helix-primitive-spacing-150)',
      background:     'var(--helix-color-fill-page)',
      borderBottom:   '1px solid var(--helix-color-border-neutral)',
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 'var(--helix-primitive-fontSize-xl)', fontWeight: 'var(--helix-primitive-fontWeight-bold)', color: 'var(--helix-color-text-neutral)' }}>
          Projects
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-light)' }}>
          24 projects · 3 shared with you
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)' }}>
        <Button variant="secondary" icon={IconUpload}>Import</Button>
        <Button variant="primary"   icon={IconPlus}>New project</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: '**Pattern: Action Bar** — page header variant. One primary CTA, one secondary.' },
    },
  },
};

export const ActionBarBatchSelection: Story = {
  render: () => {
    const [selected, setSelected] = useState(3);
    return (
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         'var(--helix-primitive-spacing-75)',
        padding:     'var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)',
        background:  'var(--helix-color-fill-primary-light)',
        border:      '1px solid var(--helix-color-border-focus)',
        borderRadius:'var(--helix-radius-m)',
      }}>
        <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', fontWeight: 'var(--helix-primitive-fontWeight-medium)', color: 'var(--helix-color-text-primary)' }}>
          {selected} selected
        </span>
        <div style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)' }}>
          <Button variant="ghost" size="s">Archive</Button>
          <Button variant="ghost" size="s">Move to…</Button>
        </div>
        <div style={{ marginLeft: 'var(--helix-primitive-spacing-100)' }}>
          <Button variant="danger" size="s" icon={IconTrash}>Delete</Button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: '**Batch action bar** — danger action separated by extra gap on the right.' },
    },
  },
};

/* ════════════════════════════════════════════════════════════════════════════
   STATUS ROWS
   ════════════════════════════════════════════════════════════════════════════ */

export const StatusRows: Story = {
  render: () => {
    const rows = [
      { label: 'Deploy to production', variant: 'success' as const, status: 'Success',   meta: '2 min ago' },
      { label: 'Run test suite',        variant: 'warning' as const, status: 'Warning',   meta: '5 min ago' },
      { label: 'Build Docker image',    variant: 'neutral' as const, status: 'Queued',    meta: '12 min ago' },
      { label: 'Code review',           variant: 'danger'  as const, status: 'Failed',    meta: '1 hr ago' },
      { label: 'Security scan',         variant: 'info'    as const, status: 'Scheduled', meta: 'In queue' },
    ];

    const icons = {
      success: IconCheck,
      warning: IconAlertTriangle,
      neutral: IconClock,
      danger:  IconX,
      info:    IconInfoCircle,
    };

    return (
      // Rows share the container's columns (subgrid), so every badge sits in the same column, left-aligned —
      // per-row flex left each badge wherever its own label's width happened to end.
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr auto auto',
        columnGap:           'var(--helix-primitive-spacing-75)',
        border:              '1px solid var(--helix-color-border-neutral)',
        borderRadius:        'var(--helix-radius-l)',
        overflow:            'hidden',
        maxWidth:            '500px',
      }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display:             'grid',
              gridColumn:          '1 / -1',
              gridTemplateColumns: 'subgrid',
              alignItems:          'center',
              justifyItems:        'start',
              padding:             'var(--helix-primitive-spacing-75) var(--helix-primitive-spacing-100)',
              borderBottom: i < rows.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
            }}
          >
            <span style={{
              flex:       1,
              fontSize:   'var(--helix-primitive-fontSize-s)',
              color:      'var(--helix-color-text-neutral)',
              fontWeight: 'var(--helix-primitive-fontWeight-medium)',
            }}>
              {row.label}
            </span>
            <Badge variant={row.variant} icon={icons[row.variant]} label={row.status} />
            <span style={{
              fontSize:  'var(--helix-primitive-fontSize-s)',
              color:     'var(--helix-color-text-neutral-lightest)',
              justifySelf: 'end',
              textAlign: 'right',
            }}>
              {row.meta}
            </span>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: '**Pattern: Status Row** — `.ai/maps/patterns/status-row.md`. Status communicated via label + color + icon.' },
    },
  },
};

/* ════════════════════════════════════════════════════════════════════════════
   SEARCH + FILTER
   ════════════════════════════════════════════════════════════════════════════ */

export const SearchAndFilter: Story = {
  render: () => {
    const [query, setQuery]               = useState('');
    const [activeFilters, setActiveFilters] = useState([
      { key: 'status',   label: 'Status: Active' },
      { key: 'date',     label: 'Date: This week' },
    ]);

    function removeFilter(key: string) {
      setActiveFilters(f => f.filter(x => x.key !== key));
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-75)', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-2xs)' }}>
          <Input
            label="Search"
            hideLabel
            icon={IconSearch}
            placeholder="Search projects…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            fullWidth
          />
          {activeFilters.length > 0 && (
            <Button variant="secondary" size="m" onPress={() => setActiveFilters([])}>
              Clear
            </Button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div
            aria-label="Active filters"
            style={{ display: 'flex', gap: 'var(--helix-spacing-2xs)', flexWrap: 'wrap' }}
          >
            {activeFilters.map(f => (
              <Chip
                key={f.key}
                variant="neutral"
                size="s"
                label={f.label}
                dismissible
                onDismiss={() => removeFilter(f.key)}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '**Pattern: Search + Filter** — active filters are real neutral `<Chip>`s (`dismissible`), not a `<Button>` with an X nor a `<Badge>` (not interactive). Try removing a filter with its ×.',
      },
    },
  },
};

/* ════════════════════════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════════════════════════ */

type Trend = 'up' | 'down';

function StatCard({
  label, value, delta, trend,
}: { label: string; value: string; delta?: string; trend?: Trend }) {
  return (
    <Card>
      {/* Header row: label on the left, delta Badge on the right, both centered on the label's line */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            'var(--helix-spacing-xs)',
        marginBottom:   'var(--helix-spacing-xs)',
      }}>
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
        }}>
          {label}
        </div>
        {delta && (
          // The delta is a Badge: success when up, danger when down, neutral with no trend — its icon slot
          // carries the trend arrow.
          <Badge
            variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'neutral'}
            size="xs"
            label={delta}
            {...(trend ? { icon: trend === 'up' ? IconArrowUpRight : IconArrowDownRight } : {})}
          />
        )}
      </div>
      <div style={{
        fontFamily:    'var(--helix-textStyle-heading-3xl-bold-fontFamily)',
        fontSize:      'var(--helix-textStyle-heading-3xl-bold-fontSize)',
        fontWeight:    'var(--helix-textStyle-heading-3xl-bold-fontWeight)',
        lineHeight:    'var(--helix-textStyle-heading-3xl-bold-lineHeight)',
        letterSpacing: 'var(--helix-primitive-letterSpacing-tight)',
        color:         'var(--helix-color-text-neutral)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </Card>
  );
}

export const StatCardPattern: Story = {
  render: () => (
    <div style={{
      display:               'grid',
      gridTemplateColumns:   'repeat(auto-fit, minmax(180px, 1fr))',
      gap:                   'var(--helix-spacing-s)',
      maxWidth:               '700px',
    }}>
      <StatCard label="Members"    value="6"   delta="+2"   trend="up" />
      <StatCard label="Active"     value="4"   delta="+1"   trend="up" />
      <StatCard label="Components" value="103" delta="+14"  trend="up" />
      <StatCard label="Coverage"   value="89%" delta="-2" trend="down" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '**Pattern: Stat Card** — `.ai/maps/patterns/stat-card.md`. A `Card` composed with a fixed label/value/delta layout — not its own component, copy the recipe.',
      },
    },
  },
};

import React from 'react';
