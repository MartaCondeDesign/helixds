import type { Meta, StoryObj } from '@storybook/react';
import type * as React from 'react';
import { Badge } from '@helix-ds/core';
import type { BadgeVariant } from '@helix-ds/core';
import { StoryHeader } from './_shared/StoryHeader';
import manifest from '../../../contracts/manifest.json';
import figmaSync from '../../../contracts/figma-sync.json';

const meta: Meta = {
  title: 'Status',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'A doneness matrix for every component — generated from `contracts/manifest.json`, nothing here is hand-written.',
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
  { status: 'draft',      description: 'In active development — API and behavior can still change without notice. Not safe to depend on yet.' },
  { status: 'beta',       description: 'Contract is defined and the component works, but it’s still being validated in real use before it’s locked in.' },
  { status: 'stable',     description: 'Contract is frozen and production-ready. Breaking changes only ship through a deprecation, not a silent edit.' },
  { status: 'deprecated', description: 'Scheduled for removal — do not use in new work; existing usages should migrate off it.' },
];

// Mirrors Storybook's own id sanitizer: "{Components|Layout}/{Name}" -> "components-name"/"layout-name",
// lowercased, no word-splitting on camelCase — matches what /index.json actually serves.
function storyDocsHref(category: string, name: string): string {
  const group = category === 'layout' ? 'layout' : 'components';
  return `/?path=/docs/${group}-${name.toLowerCase()}--docs`;
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span style={{
      color: ok ? 'var(--helix-color-text-success)' : 'var(--helix-color-text-danger)',
      fontWeight: 'var(--helix-textStyle-body-s-medium-fontWeight)',
    }}>
      {ok ? '✓' : '✗'}
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

const TD_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  borderBottom: '1px solid var(--helix-color-border-neutral-light)',
  color: 'var(--helix-color-text-neutral)',
};

const figmaSyncByName = new Map(figmaSync.components.map(c => [c.name, c]));

export const Overview: Story = {
  render: () => {
    const rows = [...manifest.components].sort((a, b) => a.name.localeCompare(b.name));
    const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    const inFigmaCount = figmaSync.components.filter(c => c.inFigma).length;

    return (
      <div>
        <StoryHeader
          title="Status"
          description={`Doneness matrix for ${manifest.count} components, generated from contracts/manifest.json (pnpm docs:manifest). ✓/✗ columns are real checks, not opinions — drift shows up in the generator's own output before it ever reaches this table. The Figma column reflects contracts/figma-sync.json (${inFigmaCount}/${figmaSync.components.length} modeled so far) — see the Figma Sync page for the full per-component detail.`}
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
                <th style={TH_STYLE}>Category</th>
                <th style={TH_STYLE}>Contract</th>
                <th style={TH_STYLE}>Export</th>
                <th style={TH_STYLE}>Doc</th>
                <th style={TH_STYLE}>Types</th>
                <th style={TH_STYLE}>Story</th>
                <th style={TH_STYLE}>A11y</th>
                <th style={TH_STYLE}>
                  <a href="/?path=/docs/figma-sync--docs" target="_top" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    Figma
                  </a>
                </th>
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
                  <td style={TD_STYLE}>{r.category}</td>
                  <td style={TD_STYLE}><Check ok={!!r.contract} /></td>
                  <td style={TD_STYLE}><Check ok={r.exports.component} /></td>
                  <td style={TD_STYLE}><Check ok={r.exports.doc} /></td>
                  <td style={TD_STYLE}><Check ok={r.exports.types.length > 0} /></td>
                  <td style={TD_STYLE}><Check ok={!!r.story} /></td>
                  <td style={TD_STYLE}><Check ok={r.a11yComplete} /></td>
                  <td style={TD_STYLE}><Check ok={!!figmaSyncByName.get(r.name)?.inFigma} /></td>
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
