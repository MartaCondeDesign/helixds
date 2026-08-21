import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, Input, Badge } from '@helix-ds/core';
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
      gap:            'var(--helix-primitive-spacing-4)',
      padding:        'var(--helix-primitive-spacing-12)',
      textAlign:      'center',
      background:     'var(--helix-color-fill-surface)',
      borderRadius:   'var(--helix-primitive-radius-xl)',
      border:         '1px dashed var(--helix-color-border-neutral)',
      maxWidth:       '420px',
    }}>
      <span style={{ color: 'var(--helix-color-text-neutral-light)' }} aria-hidden="true">
        <IconFolderOpen size={48} />
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-2)' }}>
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

      <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-3)' }}>
        <Button variant="secondary" icon={<IconUpload size={16} />}>Import</Button>
        <Button variant="primary"   icon={<IconPlus size={16} />}>New project</Button>
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
      padding:        'var(--helix-primitive-spacing-4) var(--helix-primitive-spacing-6)',
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
      <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-2)' }}>
        <Button variant="secondary" icon={<IconUpload size={16} />}>Import</Button>
        <Button variant="primary"   icon={<IconPlus size={16} />}>New project</Button>
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
        gap:         'var(--helix-primitive-spacing-3)',
        padding:     'var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)',
        background:  'var(--helix-color-fill-primary-light)',
        border:      '1px solid var(--helix-color-border-focus)',
        borderRadius:'var(--helix-primitive-radius-m)',
      }}>
        <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', fontWeight: 'var(--helix-primitive-fontWeight-medium)', color: 'var(--helix-color-text-primary)' }}>
          {selected} selected
        </span>
        <div style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-1)' }}>
          <Button variant="ghost" size="s">Archive</Button>
          <Button variant="ghost" size="s">Move to…</Button>
        </div>
        <div style={{ marginLeft: 'var(--helix-primitive-spacing-4)' }}>
          <Button variant="danger" size="s" icon={<IconTrash size={14} />}>Delete</Button>
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
      success: <IconCheck size={10} />,
      warning: <IconAlertTriangle size={10} />,
      neutral: <IconClock size={10} />,
      danger:  <IconX size={10} />,
      info:    <IconInfoCircle size={10} />,
    };

    return (
      <div style={{
        border:       '1px solid var(--helix-color-border-neutral)',
        borderRadius: 'var(--helix-primitive-radius-l)',
        overflow:     'hidden',
        maxWidth:     '500px',
      }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--helix-primitive-spacing-3)',
              padding:      'var(--helix-primitive-spacing-3) var(--helix-primitive-spacing-4)',
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
              fontSize:  'var(--helix-primitive-fontSize-xs)',
              color:     'var(--helix-color-text-neutral-lightest)',
              minWidth:  '64px',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-3)', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-primitive-spacing-2)' }}>
          <Input
            label="Search"
            hideLabel
            icon={<IconSearch size={16} />}
            placeholder="Search projects…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            fullWidth
          />
          <Button variant="secondary" size="m">Status</Button>
          <Button variant="secondary" size="m">Date</Button>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
                size="m"
              icon={<IconX size={14} />}
              onPress={() => setActiveFilters([])}
            >
              Clear
            </Button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div
            aria-label="Active filters"
            style={{ display: 'flex', gap: 'var(--helix-primitive-spacing-2)', flexWrap: 'wrap' }}
          >
            {activeFilters.map(f => (
              <Button
                key={f.key}
                variant="secondary"
                size="xs"
                iconEnd={<IconX size={11} />}
                onPress={() => removeFilter(f.key)}
                aria-label={`Remove filter: ${f.label}`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '**Pattern: Search + Filter** — active filter chips use `<Button>`, not `<Badge>` (they must be interactive). Try removing a filter.',
      },
    },
  },
};

import React from 'react';
