/** Machine-readable component documentation for the Helix SidePanel. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'SidePanel',
  purpose: 'A modal panel anchored to the right edge of the viewport, for a persistent secondary task alongside the main page.',
  contract: 'contracts/components/SidePanel.json',
  a11y: [
    'Same native <dialog> + showModal() primitive as Modal — focus trap, Escape-to-close, top-layer stacking (see ADR-010). No backdrop scrim, unlike Modal — the page behind stays visible.',
    'The title is referenced via aria-labelledby, giving the panel its accessible name.',
    'SidePanel never closes itself — it always calls onDismiss and expects the consumer to set expanded to false.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'side-panel-root', label: 'fill', token: '--helix-sidePanel-fill', kind: 'color' },
    { part: 'side-panel-root', label: 'shadow (placement=right)', token: '--helix-sidePanel-shadow', kind: 'shadow' },
    { part: 'side-panel-root', label: 'shadow (placement=bottom)', token: '--helix-sidePanel-shadowBottom', kind: 'shadow' },
    { part: 'side-panel-root', label: 'width', token: '--helix-sidePanel-width', kind: 'space' },
  ],
  features: [
    'label — the panel\'s title / accessible name',
    'expanded / onDismiss — always controlled, no uncontrolled form',
    'showCloseButton — toggles the header\'s X button',
    'closeOnBackdropClick — toggles dismissal on a click outside the panel',
    'placement — \'right\' (default, full height) or \'bottom\' (full width) — same vocabulary as Tooltip\'s placement prop',
  ],
  examples: [
    { label: 'Basic', code: `<SidePanel label="Edit filters" expanded={isOpen} onDismiss={() => setIsOpen(false)}>...</SidePanel>` },
  ],
};
