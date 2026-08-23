/** Machine-readable component documentation for the Helix StatCard. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'StatCard',
  purpose: 'Displays a single key metric — label, value, and an optional trend delta — for dashboard KPI rows.',
  contract: 'contracts/components/StatCard.json',
  a11y: [
    'Trend must be conveyed by both the arrow icon direction and the +/- sign in delta text, never color alone.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'stat-card-label', label: 'fontSize', token: '--helix-statCard-label-fontSize', kind: 'typography' },
    { part: 'stat-card-label', label: 'fontWeight', token: '--helix-statCard-label-fontWeight', kind: 'typography' },
    { part: 'stat-card-label', label: 'color', token: '--helix-statCard-label-color', kind: 'color' },
    { part: 'stat-card-value', label: 'fontSize', token: '--helix-statCard-value-fontSize', kind: 'typography' },
    { part: 'stat-card-value', label: 'fontWeight', token: '--helix-statCard-value-fontWeight', kind: 'typography' },
    { part: 'stat-card-value', label: 'color', token: '--helix-statCard-value-color', kind: 'color' },
    { part: 'stat-card-delta', label: 'fontSize', token: '--helix-statCard-delta-fontSize', kind: 'typography' },
    { part: 'stat-card-delta', label: 'text.up', token: '--helix-statCard-delta-textUp', kind: 'color', meta: 'trend=up' },
    { part: 'stat-card-delta', label: 'text.down', token: '--helix-statCard-delta-textDown', kind: 'color', meta: 'trend=down' },
    { part: 'stat-card-delta-icon', label: 'icon.up', token: '--helix-statCard-delta-iconUp', kind: 'color', meta: 'trend=up' },
    { part: 'stat-card-delta-icon', label: 'icon.down', token: '--helix-statCard-delta-iconDown', kind: 'color', meta: 'trend=down' },
  ],
  features: [
    'Composes Card internally — fill/border/radius/shadow come from Card, not reimplemented here',
    'trend — omit for a plain-text delta with no icon/color',
  ],
  examples: [
    { label: 'Default', code: `<StatCard label="Members" value="6" delta="+2" trend="up" />` },
    { label: 'Down trend', code: `<StatCard label="Token coverage" value="89%" delta="-2pp" trend="down" />` },
    { label: 'No delta', code: `<StatCard label="Members" value="6" />` },
  ],
};
