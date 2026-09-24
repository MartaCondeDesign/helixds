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
    { part: 'card-root', label: 'background', token: '--helix-card-fill', kind: 'color', colorRole: 'background' },
    { part: 'card-root', label: 'border', token: '--helix-card-border', kind: 'color', colorRole: 'border' },
    { part: 'card-header', label: 'text', token: '--helix-color-text-neutral', kind: 'color', colorRole: 'text' },
    { part: 'card-body', label: 'text', token: '--helix-color-text-neutral', kind: 'color', colorRole: 'text' },
    { part: 'card-root', label: 'radius', token: '--helix-card-radius', kind: 'radius' },
    { part: 'card-body', label: 'padding.end', token: '--helix-card-padding', kind: 'space', paddingSides: ['end'] },
    { part: 'card-body', label: 'padding.bottom', token: '--helix-card-padding', kind: 'space', paddingSides: ['bottom'] },
    { part: 'card-body', label: 'padding.start', token: '--helix-card-padding', kind: 'space', paddingSides: ['start'] },
    { part: 'card-body', label: 'padding.top', token: '--helix-card-padding', kind: 'space', paddingSides: ['top'], meta: 'Without a header only — after a header the body starts right below its 8px gap' },
    { part: 'card-header', label: 'padding.top', token: '--helix-card-padding', kind: 'space', paddingSides: ['top'] },
    { part: 'card-header', label: 'padding.end', token: '--helix-card-padding', kind: 'space', paddingSides: ['end'] },
    { part: 'card-header', label: 'padding.start', token: '--helix-card-padding', kind: 'space', paddingSides: ['start'] },
    { part: 'card-header', label: 'padding.bottom', token: '--helix-card-header-paddingBottom', kind: 'space', paddingSides: ['bottom'] },
    { part: 'card-header', label: 'fontFamily', token: '--helix-card-header-fontFamily', kind: 'typography', meta: 'Heading / l / Bold' },
    { part: 'card-header', label: 'fontSize', token: '--helix-card-header-fontSize', kind: 'typography', meta: 'Heading / l / Bold' },
    { part: 'card-header', label: 'fontWeight', token: '--helix-card-header-fontWeight', kind: 'typography', meta: 'Heading / l / Bold' },
    { part: 'card-header', label: 'lineHeight', token: '--helix-card-header-lineHeight', kind: 'typography', meta: 'Heading / l / Bold' },
    { part: 'card-body', label: 'fontFamily', token: '--helix-textStyle-body-m-regular-fontFamily', kind: 'typography', meta: 'Body / m / Regular' },
    { part: 'card-body', label: 'fontSize', token: '--helix-textStyle-body-m-regular-fontSize', kind: 'typography', meta: 'Body / m / Regular' },
    { part: 'card-body', label: 'fontWeight', token: '--helix-textStyle-body-m-regular-fontWeight', kind: 'typography', meta: 'Body / m / Regular' },
    { part: 'card-body', label: 'lineHeight', token: '--helix-textStyle-body-m-regular-lineHeight', kind: 'typography', meta: 'Body / m / Regular' },
  ],
  features: [
    'header — optional title/actions row, 8px above the body, no divider',
    "padding='none' — removes body padding for edge-to-edge content like a Table",
  ],
  examples: [
    { label: 'Default', code: `<Card>Widget content</Card>` },
    { label: 'With header', code: `<Card header="Team activity">...</Card>` },
    { label: 'Edge-to-edge content', code: `<Card padding="none"><Table>...</Table></Card>` },
  ],
};
