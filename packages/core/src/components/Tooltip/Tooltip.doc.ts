/** Machine-readable component documentation for the Helix Tooltip. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Tooltip',
  purpose: 'Reveals a short, non-interactive text label for whatever it wraps, on hover or keyboard focus — identifies an ambiguous control without adding permanent visible text.',
  contract: 'contracts/components/Tooltip.json',
  a11y: [
    'role="tooltip" on the content, referenced from the trigger via aria-describedby — the trigger element must accept and forward that attribute to its own DOM node.',
    'Shown on :hover AND :focus-within, so keyboard users get it too, not just mouse hover.',
    'Escape dismisses the tooltip while the trigger is focused.',
    'Never put interactive content (links, buttons) inside the tooltip — use Popover/Menu instead.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'tooltip-content', label: 'fill', token: '--helix-tooltip-fill', kind: 'color' },
    { part: 'tooltip-content', label: 'text', token: '--helix-tooltip-text', kind: 'color' },
    { part: 'tooltip-content', label: 'radius', token: '--helix-tooltip-radius', kind: 'radius' },
    { part: 'tooltip-content', label: 'shadow', token: '--helix-tooltip-shadow', kind: 'shadow' },
    { part: 'tooltip-content', label: 'padding-x', token: '--helix-tooltip-padding-x', kind: 'space' },
    { part: 'tooltip-content', label: 'padding-y', token: '--helix-tooltip-padding-y', kind: 'space' },
    { part: 'tooltip-content', label: 'offset', token: '--helix-tooltip-offset', kind: 'space' },
    { part: 'tooltip-content', label: 'delay', token: '--helix-tooltip-delay', kind: 'other' },
  ],
  features: [
    'label — the tooltip text (short, plain text only)',
    'placement — top/bottom/left/right, a preference: auto-flips to the opposite side (and clamps sideways) if that would clip the viewport (see ADR-009)',
    'expanded — forces the content visible or hidden regardless of hover/focus, for a controlled/always-shown case',
  ],
  examples: [
    { label: 'Basic', code: `<Tooltip label="Delete"><IconButton icon={IconTrash} label="Delete" /></Tooltip>` },
    { label: 'Placement', code: `<Tooltip label="Ana García" placement="bottom"><Avatar label="Ana García" /></Tooltip>` },
  ],
};
