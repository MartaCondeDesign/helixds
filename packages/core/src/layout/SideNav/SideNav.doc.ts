/** Machine-readable component documentation for the Helix SideNav. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'SideNav',
  purpose: 'The persistent vertical navigation rail of an app shell.',
  contract: 'contracts/components/SideNav.json',
  a11y: [
    'Always a native <nav> — carries the navigation landmark role.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'side-nav-root', label: 'width', token: '--helix-sideNav-width', kind: 'space' },
    { part: 'side-nav-root', label: 'fill', token: '--helix-sideNav-fill', kind: 'color' },
    { part: 'side-nav-root', label: 'border-right', token: '--helix-sideNav-border', kind: 'color' },
  ],
  features: [
    'children — a list of NavItem, not a config array, keeps composition explicit',
    'brand/footer — optional slots at the top and bottom',
  ],
  examples: [
    {
      label: 'Full sidebar',
      code: `<SideNav
  brand={<Logo />}
  footer={<Avatar label="Marta Conde" variant="solid" />}
>
  <NavItem label="Dashboard" href="/dashboard" icon={IconLayoutDashboard} />
  <NavItem label="Team" href="/team" icon={IconUsers} current />
</SideNav>`,
    },
  ],
};
