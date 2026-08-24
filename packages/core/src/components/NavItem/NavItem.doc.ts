/** Machine-readable component documentation for the Helix NavItem. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'NavItem',
  purpose: 'A single entry in a persistent navigation list that links to another view.',
  contract: 'contracts/components/NavItem.json',
  a11y: [
    "Always a real <a href> — never a <button> (Button's own contract forbids using it for pure navigation).",
    "current sets aria-current='page', not aria-selected or a custom attribute.",
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'nav-item', label: 'fill.hover', token: '--helix-navItem-fill-hover', kind: 'color', state: 'hover' },
    { part: 'nav-item', label: 'fill.current', token: '--helix-navItem-fill-current', kind: 'color' },
    { part: 'nav-item-label', label: 'text.default', token: '--helix-navItem-text-default', kind: 'color' },
    { part: 'nav-item-label', label: 'text.current', token: '--helix-navItem-text-current', kind: 'color' },
    { part: 'nav-item-icon', label: 'icon.default', token: '--helix-navItem-icon-default', kind: 'color' },
    { part: 'nav-item-icon', label: 'icon.current', token: '--helix-navItem-icon-current', kind: 'color' },
    { part: 'nav-item', label: 'radius', token: '--helix-navItem-radius', kind: 'radius' },
    { part: 'nav-item-label', label: 'fontSize', token: '--helix-navItem-fontSize', kind: 'typography', meta: 'Body / s / Medium' },
    { part: 'nav-item-label', label: 'fontWeight', token: '--helix-navItem-fontWeight', kind: 'typography', meta: 'Body / s / Medium' },
  ],
  features: [
    'current — the current-view state, aria-current="page" plus a tinted background and brand-colored text/icon',
    'icon — optional leading icon at a fixed 16px',
  ],
  examples: [
    { label: 'Default', code: `<NavItem label="Dashboard" href="/dashboard" icon={IconLayoutDashboard} />` },
    { label: 'Current', code: `<NavItem label="Team" href="/team" icon={IconUsers} current />` },
  ],
};
