import type { Meta, StoryObj } from '@storybook/react';
import type * as React from 'react';
import { IconCircleCheckFilled, IconCircleXFilled } from '@tabler/icons-react';
import { Badge, Icon } from '@helix-ds/core';
import type { BadgeVariant } from '@helix-ds/core';
import { StoryHeader } from './_shared/StoryHeader';
import stability from '../../../contracts/stability.json';

const meta: Meta = {
  title: 'Status',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Every component’s status, computed from 8 automatic criteria + Figma — generated from `contracts/stability.json` (`pnpm verify:stable`), nothing here is hand-written.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  stable: 'success',
  beta: 'warning',
  draft: 'neutral',
  deprecated: 'danger',
  unknown: 'neutral',
};

const STATUS_LEGEND: { status: string; description: string }[] = [
  { status: 'draft',      description: 'The component exists and works, but at least one of the 8 automatic criteria still fails (hover a ✗ to see what).' },
  { status: 'beta',       description: 'All 8 automatic criteria pass — built, in Storybook, tokens applied, accessible and tested in light and dark. Not in Figma yet.' },
  { status: 'stable',     description: 'Beta, and also modeled in Figma. The Figma step is done on request, then the next pnpm verify:stable promotes it.' },
  { status: 'deprecated', description: 'Scheduled for removal — do not use in new work; existing usages should migrate off it. The only status set by hand.' },
];

type CriterionKey = keyof typeof stability.criteria;
const CRITERIA = Object.entries(stability.criteria) as [CriterionKey, { label: string; description: string }][];

// Mirrors Storybook's own id sanitizer: "{Components|Layout}/{Name}" -> "components-name"/"layout-name",
// lowercased, no word-splitting on camelCase — matches what /index.json actually serves.
function storyDocsHref(category: string, name: string): string {
  const group = category === 'layout' ? 'layout' : 'components';
  return `/?path=/docs/${group}-${name.toLowerCase()}--docs`;
}

function Check({ ok, details = [] }: { ok: boolean; details?: string[] }) {
  return (
    <span title={ok ? undefined : details.join('\n')} style={{ display: 'inline-flex' }}>
      <Icon
        icon={ok ? IconCircleCheckFilled : IconCircleXFilled}
        size={16}
        color={ok ? 'var(--helix-color-text-success)' : 'var(--helix-color-text-danger)'}
        decorative={false}
        label={ok ? 'Yes' : `No: ${details.join('; ')}`}
      />
    </span>
  );
}

const TH_STYLE: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)',
};

// Criterion headers carry their explanation in a native tooltip (title) — dotted underline + help
// cursor signal that hovering reveals more.
const HINT_TH_STYLE: React.CSSProperties = {
  ...TH_STYLE,
  cursor: 'help',
  textDecoration: 'underline dotted',
  textUnderlineOffset: 3,
};

const TD_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  borderBottom: '1px solid var(--helix-color-border-neutral-light)',
  color: 'var(--helix-color-text-neutral)',
};

export const Overview: Story = {
  render: () => {
    const rows = [...stability.components].sort((a, b) => a.name.localeCompare(b.name));
    const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    const inFigmaCount = rows.filter(r => r.inFigma).length;

    return (
      <div>
        <StoryHeader
          title="Status"
          description={`Status of ${rows.length} components, computed by pnpm verify:stable (ADR-018) from 8 automatic criteria — real checks run in a browser, in light and dark mode, not opinions — plus Figma (${inFigmaCount}/${rows.length} modeled). Hover a ✗ to see what's missing. Last run: ${new Date(stability.generatedAt).toLocaleString()}.`}
        />

        <div style={{ display: 'flex', gap: 'var(--helix-spacing-s)', marginBottom: 'var(--helix-spacing-l)' }}>
          {Object.entries(byStatus).map(([status, n]) => (
            <Badge key={status} variant={STATUS_VARIANT[status] ?? 'neutral'} label={`${status} ${n}`} />
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Component</th>
                <th style={TH_STYLE}>Status</th>
                {CRITERIA.map(([key, { label, description }]) => (
                  <th key={key} style={HINT_TH_STYLE} title={description}>{label}</th>
                ))}
                <th style={HINT_TH_STYLE} title={stability.figma.description}>{stability.figma.label}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name}>
                  <td style={{ ...TD_STYLE, fontWeight: 500 }}>
                    <a
                      href={storyDocsHref(r.category, r.name)}
                      target="_top"
                      title={`Open ${r.name}'s docs page`}
                      style={{ color: 'var(--helix-color-text-neutral)', textDecoration: 'underline' }}
                    >
                      {r.name}
                    </a>
                  </td>
                  <td style={TD_STYLE}>
                    <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'} label={r.status} />
                  </td>
                  {CRITERIA.map(([key]) => (
                    <td key={key} style={TD_STYLE}><Check ok={r.checks[key].pass} details={r.checks[key].details} /></td>
                  ))}
                  <td style={TD_STYLE}><Check ok={r.inFigma} details={['Not modeled in Figma yet — done on request']} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl style={{
          display: 'grid',
          gridTemplateColumns: 'auto 8px 1px var(--helix-spacing-s) 1fr',
          rowGap: 'var(--helix-spacing-s)',
          padding: 'var(--helix-spacing-m)',
          marginTop: 'var(--helix-spacing-l)',
          border: '1px solid var(--helix-color-border-neutral-light)',
          borderRadius: 'var(--helix-radius-m)',
        }}>
          <span
            aria-hidden="true"
            style={{
              gridColumn: 3,
              gridRow: `1 / span ${STATUS_LEGEND.length}`,
              background: 'var(--helix-color-border-neutral-light)',
            }}
          />
          {STATUS_LEGEND.flatMap(({ status, description }, i) => [
            <dt key={`${status}-badge`} style={{ gridColumn: 1, gridRow: i + 1, alignSelf: 'center', margin: 0 }}>
              <Badge variant={STATUS_VARIANT[status] ?? 'neutral'} label={status} />
            </dt>,
            <dd
              key={`${status}-desc`}
              style={{ gridColumn: 5, gridRow: i + 1, alignSelf: 'center', margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--helix-color-text-neutral-light)' }}
            >
              {description}
            </dd>,
          ])}
        </dl>
      </div>
    );
  },
};
