/** Machine-readable component documentation for the Helix AppShell. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'AppShell',
  purpose: 'The top-level page shell — composes SideNav, TopBar, and scrollable main content into one full-height layout.',
  contract: 'contracts/components/AppShell.json',
  a11y: [
    'app-shell-main is the page\'s one <main> landmark.',
    'Below 768px the SideNav collapses; the TopBar\'s menu button (aria-label "Navigation menu", aria-expanded, aria-controls) opens it over the content and moves focus to its current link.',
    'Escape, following a link, a press outside or tabbing out of the open nav closes it; Escape returns focus to the menu button.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'app-shell-root', label: 'fill', token: '--helix-color-fill-page', kind: 'color' },
    { part: 'app-shell-nav', label: 'top (collapsed, open)', token: '--helix-topBar-height', kind: 'space' },
    { part: 'app-shell-nav', label: 'slide duration', token: '--helix-duration-slow', kind: 'other' },
  ],
  features: [
    'sidenav/topbar — pass a SideNav/TopBar instance, or omit either for a shell with no nav or no chrome bar',
    'sidenavExpanded / defaultSidenavExpanded / onSidenavExpandedChange — below 768px of the shell\'s width the SideNav collapses behind a menu button in the TopBar; controlled or uncontrolled, like Accordion\'s expanded',
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
