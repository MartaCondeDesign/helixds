/** Machine-readable component documentation for the Helix AppShell. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'AppShell',
  purpose: 'The top-level page shell — composes SideNav, TopBar, and scrollable main content into one full-height layout.',
  contract: 'contracts/components/AppShell.json',
  a11y: [
    'app-shell-main is the page\'s one <main> landmark.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'app-shell-root', label: 'fill', token: '--helix-color-fill-page', kind: 'color' },
  ],
  features: [
    'sidenav/topbar — pass a SideNav/TopBar instance, or omit either for a shell with no nav or no chrome bar',
    'Renders the full-height flex structure itself — no consumer ever writes display:flex; height:100vh again. Exactly one viewport tall; only main scrolls',
  ],
  examples: [
    {
      label: 'Full shell',
      code: `<AppShell sidenav={<SideNav>...</SideNav>} topbar={<TopBar start={...} end={...} />}>
  <PageHeader label="Team" />
  {/* page content */}
</AppShell>`,
    },
  ],
};
