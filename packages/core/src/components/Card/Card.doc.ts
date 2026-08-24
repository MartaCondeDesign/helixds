/** Machine-readable component documentation for the Helix Card. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Card',
  purpose: 'Groups related content in a visually distinct, flat surface.',
  contract: 'contracts/components/Card.json',
  a11y: [
    'Card has no implicit landmark role — add one at the usage site only if the card represents a distinct region.',
    'Never Card-wrap individual rows in a dense list — use Table or List/Item edge-to-edge instead.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'card-root', label: 'fill', token: '--helix-card-fill', kind: 'color' },
    { part: 'card-root', label: 'border', token: '--helix-card-border', kind: 'color' },
    { part: 'card-root', label: 'radius', token: '--helix-card-radius', kind: 'radius' },
    { part: 'card-body', label: 'padding', token: '--helix-card-padding', kind: 'space' },
    { part: 'card-header', label: 'padding', token: '--helix-card-padding', kind: 'space' },
    { part: 'card-header', label: 'border-bottom', token: '--helix-card-border', kind: 'color' },
  ],
  features: [
    'header — optional title/actions row, separated from the body by a divider',
    "padding='none' — removes body padding for edge-to-edge content like a Table",
  ],
  examples: [
    { label: 'Default', code: `<Card>Widget content</Card>` },
    { label: 'With header', code: `<Card header={<strong>Team activity</strong>}>...</Card>` },
    { label: 'Edge-to-edge content', code: `<Card padding="none"><Table>...</Table></Card>` },
  ],
};
