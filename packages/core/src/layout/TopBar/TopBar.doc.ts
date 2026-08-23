/** Machine-readable component documentation for the Helix TopBar. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'TopBar',
  purpose: 'The fixed-height chrome bar at the top of a page — search, quick actions, and the current user.',
  contract: 'contracts/components/TopBar.json',
  a11y: [
    'Always a native <header> — carries the banner landmark role when it is a direct child of <body> in a real page.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'topbar-root', label: 'height', token: '--helix-topBar-height', kind: 'space' },
    { part: 'topbar-root', label: 'fill', token: '--helix-topBar-fill', kind: 'color' },
    { part: 'topbar-root', label: 'border-bottom', token: '--helix-topBar-border', kind: 'color' },
  ],
  features: [
    'start/end — slot pattern, not fixed single-purpose props, so TopBar isn’t over-fitted to one exact button count',
  ],
  examples: [
    {
      label: 'Search + actions',
      code: `<TopBar
  start={<Input label="Search" hideLabel icon={IconSearch} placeholder="Search…" />}
  end={<><Button variant="ghost" size="s" icon={IconBell} /><Avatar label="Marta Conde" variant="solid" /></>}
/>`,
    },
  ],
};
