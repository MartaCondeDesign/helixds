/** Machine-readable component documentation for the Helix Accordion. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Accordion',
  purpose: 'A single collapsible disclosure — a header that expands/collapses a panel of content.',
  contract: 'contracts/components/Accordion.json',
  a11y: [
    'Built on native <details>/<summary> — open/closed state, keyboard support (Enter/Space), and the implicit disclosure semantics all come from the element itself, no hand-rolled ARIA.',
    'The chevron is aria-hidden — the open/closed state is already exposed by <details>, not by the icon.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'accordion-root', label: 'fill', token: '--helix-accordion-fill', kind: 'color' },
    { part: 'accordion-root', label: 'border', token: '--helix-accordion-border', kind: 'color' },
    { part: 'accordion-header', label: 'text', token: '--helix-accordion-text', kind: 'color' },
    { part: 'accordion-chevron', label: 'chevron', token: '--helix-accordion-chevron', kind: 'color' },
  ],
  features: [
    'label — the header text',
    'expanded / defaultExpanded / onExpandedChange — controlled or uncontrolled, same pattern as Switch',
    'disabled — prevents toggling',
  ],
  examples: [
    { label: 'Basic', code: `<Accordion label="Shipping details">Ships in 3-5 business days.</Accordion>` },
    { label: 'Controlled', code: `<Accordion label="Advanced" expanded={isExpanded} onExpandedChange={setIsExpanded}>...</Accordion>` },
  ],
};
