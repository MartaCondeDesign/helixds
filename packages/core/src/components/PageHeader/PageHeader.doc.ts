/** Machine-readable component documentation for the Helix PageHeader. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'PageHeader',
  purpose: 'Introduces a page or major section: title, optional description, and trailing actions in one consistent row.',
  contract: 'contracts/components/PageHeader.json',
  a11y: [
    'level controls the actual heading level (h1/h2) rendered — never skip a level purely to change visual size, use CSS/tokens for that.',
    'Used once per page for level=1; level=2 for a major in-page section header.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'page-header-title', label: 'fontSize', token: '--helix-pageHeader-title-fontSize-1', kind: 'typography', meta: 'level=1' },
    { part: 'page-header-title', label: 'fontSize', token: '--helix-pageHeader-title-fontSize-2', kind: 'typography', meta: 'level=2' },
    { part: 'page-header-title', label: 'fontWeight', token: '--helix-pageHeader-title-fontWeight', kind: 'typography' },
    { part: 'page-header-title', label: 'color', token: '--helix-pageHeader-title-color', kind: 'color' },
    { part: 'page-header-description', label: 'fontSize', token: '--helix-pageHeader-description-fontSize', kind: 'typography' },
    { part: 'page-header-description', label: 'color', token: '--helix-pageHeader-description-color', kind: 'color' },
  ],
  features: [
    'level — 1 (h1, default) or 2 (h2) for the actual heading element rendered',
    'actions — trailing slot, typically a Button and/or Badge',
  ],
  examples: [
    { label: 'Default', code: `<PageHeader label="Team" description="Manage members and their access." />` },
    { label: 'With actions', code: `<PageHeader label="Team" actions={<Button variant="primary">Invite member</Button>} />` },
  ],
};
