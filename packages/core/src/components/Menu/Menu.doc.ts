/** Machine-readable component documentation for the Helix Menu. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Menu',
  purpose: 'A Helix-styled, portaled popup listbox anchored to a trigger — the internal primitive Select uses instead of a native <select> dropdown.',
  contract: 'contracts/components/Menu.json',
  a11y: [
    '`role="listbox"` on the root, `role="option"` + `aria-selected` on each item — hand-rolled, see ADR-013.',
    'Menu is deliberately non-focusable — the consumer\'s trigger owns real keyboard focus and drives selection via `aria-activedescendant`, matching how Select\'s own button trigger works.',
    'Portaled to `document.body` so it always renders above ancestor `overflow`/`z-index` — same reasoning Toast already established (ADR-011).',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'menu', label: 'Background', token: '--helix-menu-fill', kind: 'color' },
    { part: 'menu', label: 'Border', token: '--helix-menu-border', kind: 'color' },
    { part: 'menu', label: 'Elevation', token: '--helix-menu-shadow', kind: 'shadow', meta: 'semantic.shadow.m — documented as "popovers, menus"' },
    { part: 'menu', label: 'menu.radius', token: '--helix-menu-radius', kind: 'radius' },
    { part: 'menu', label: 'menu.padding', token: '--helix-menu-padding', kind: 'space' },
    { part: 'menu-item', label: 'item.height', token: '--helix-menu-item-height', kind: 'space' },
    { part: 'menu-item', label: 'Default text', token: '--helix-menu-item-text', kind: 'color' },
    { part: 'menu-item', label: 'Hover fill', token: '--helix-menu-item-fill-hover', kind: 'color', state: 'hover', meta: 'Same token NavItem\'s own hover already uses — one shared neutral hover, not a one-off.' },
    { part: 'menu-item', label: 'Selected fill', token: '--helix-menu-item-fill-selected', kind: 'color' },
    { part: 'menu-item', label: 'Selected text', token: '--helix-menu-item-text-selected', kind: 'color' },
    { part: 'menu-item', label: 'Disabled text', token: '--helix-menu-item-text-disabled', kind: 'color', state: 'disabled' },
    { part: 'menu-group-label', label: 'Text color', token: '--helix-menu-groupLabel-text', kind: 'color' },
    { part: 'menu-group-label', label: 'fontSize', token: '--helix-menu-groupLabel-fontSize', kind: 'typography', meta: 'semantic.textStyle.label-uppercase — no added letter-spacing, review feedback removed it' },
    { part: 'menu-group-label', label: 'fontWeight', token: '--helix-menu-groupLabel-fontWeight', kind: 'typography' },
    { part: 'menu-group-divider', label: 'Divider color', token: '--helix-menu-groupDivider-color', kind: 'color' },
    { part: 'menu-group-divider', label: 'Margin above', token: '--helix-menu-groupDivider-marginTop', kind: 'space', meta: '8px, to whatever precedes it' },
    { part: 'menu-group-divider', label: 'Margin below', token: '--helix-menu-groupDivider-marginBottom', kind: 'space', meta: '16px, to the group label right after it — asymmetric on purpose, per review feedback' },
  ],
  features: [
    'options — flat MenuOption[] or grouped MenuOptionGroup[] ({ label, options })',
    'value — selected value, drives aria-selected + the blue highlight',
    'activeValue — keyboard-highlighted value, drives the gray highlight (consumer owns the keyboard handling, e.g. Select)',
    'Positioning: always opens below the anchor, never flips above — horizontal clamp only, adapted from Tooltip\'s clamp (ADR-009).',
    'Not exported as a top-level app-facing pattern yet — currently consumed only by Select internally, per ADR-013\'s scope.',
  ],
  examples: [
    {
      label: 'Internal usage (via Select)',
      code: `<Menu id="my-listbox" expanded={isExpanded} anchorRef={triggerRef} options={options} value={value} onSelect={setValue} />`,
    },
  ],
};
