/**
 * Expected Figma colors AND layout, from code — `pnpm figma:expected <Name>` (Storybook must be running).
 *
 * Renders the component in Storybook for every Figma variant listed in its spec below, puts it into each
 * interaction state for real (hover = pointer over it, press = pointer down, focus = keyboard focus,
 * disabled/invalid = props), in light AND dark theme, and records the computed colors of each part.
 * Writes .ai/figma-expected/{Name}.json — the EXPECTED input of scripts/figma/audit-component.js, which
 * compares those colors against the Figma variants (the parity check). Nothing here is hand-typed color:
 * if Figma disagrees with this file, Figma is wrong (root CLAUDE.md rule 8).
 *
 * Layout (light theme, default state, per variant without its state): the root's height, padding, gap and
 * radius, every icon part's size, and every text part's font size / line height / weight / family — each with
 * the value AND the token it comes from, read from the real CSS cascade (Chrome DevTools Protocol), so the
 * audit can check Figma is bound to the RIGHT variable / Text Style, not just to some variable with the
 * same number (scripts/figma/token-chain.ts).
 *
 * A spec maps Figma variant axes to Storybook args + a state, and Figma layer names to DOM parts:
 *   parts: { '<figma layer>': { part: '<data-helix-part>', fill?: true, stroke?: true, text?: true } }
 * `(root)` is the variant component itself.
 */
import fs from 'fs';
import path from 'path';
import { chromium, type CDPSession, type Page } from 'playwright';
import { figmaTarget, tokenChain } from './token-chain.ts';

type State = 'default' | 'hover' | 'press' | 'focus' | 'disabled' | 'invalid' | 'loading' | 'open' | 'checked' | 'indeterminate';
type PartSpec = { part: string; fill?: boolean; stroke?: boolean; text?: boolean; placeholder?: boolean };
type Spec = {
  story: string;                              // a story rendering exactly one instance from its args
  axes: Record<string, string[]>;             // Figma variant axes (besides state) -> values
  states: State[];                            // the `state` axis values, in order
  args: (v: Record<string, string>, state: State) => Record<string, string | boolean>;
  parts: Record<string, PartSpec>;
  target: string;                             // the data-helix-part that receives hover/press/focus
  scope?: (v: Record<string, string>) => string; // when the story renders several instances: CSS selector of the one to measure
  storyFor?: Partial<Record<State, string>>;       // a different story for a state whose prop the main story won't take from the URL
  focusTarget?: string;                            // data-helix-part that takes keyboard focus, when it isn't `target` (e.g. Checkbox's hidden input)
  locate?: (v: Record<string, string>, state: State) => { story: string; scope: string } | null; // full control over where each combo lives (null = not shown in any story, skipped)
  // The root's border is drawn inside its box and NOT counted in Figma's auto layout, so Figma's padding is
  // measured from the outer edge (code's padding + border). Only where code's padding is a calc() around the
  // border that no scale token can express (MultiSelect: (32 − 24) / 2 − 1px = 3px) — owner's decision 2026-10-20.
  borderOutsideLayout?: boolean;
  // Typography that changes by state (MenuItem: selected is medium): measure layout in every state, keyed with it.
  layoutPerState?: boolean;
};

// Stories with NO `play` function only: a play that fails puts Storybook's error overlay on top of the
// component, and every pointer state (hover/press) silently measures the overlay instead.
const SPECS: Record<string, Spec> = {
  Chip: {
    story: 'components-chip--variants',
    axes: { variant: ['neutral', 'info', 'success', 'warning', 'danger'], size: ['s'] },
    states: ['default', 'hover', 'press', 'focus', 'disabled'],
    args: (v, s) => ({ size: v.size!, disabled: s === 'disabled' }),
    // the pill is chip-shell (Figma's root); hover/press/focus go to the chip button inside it
    parts: { '(root)': { part: 'chip-shell', fill: true, stroke: true }, 'chip-label': { part: 'chip-label', text: true } },
    target: 'chip',
    scope: v => `[data-helix-part="chip-shell"][data-variant="${v.variant}"]`,
  },
  Input: {
    story: 'components-input--default',
    axes: { size: ['m'] },
    states: ['default', 'hover', 'focus', 'invalid', 'disabled'],
    args: (v, s) => ({ label: 'Label', size: v.size!, placeholder: 'Placeholder', invalid: s === 'invalid', disabled: s === 'disabled' }),
    parts: { '(root)': { part: 'input-wrapper', fill: true, stroke: true }, 'input-field': { part: 'input-field', placeholder: true } },
    target: 'input-field',
  },
  Textarea: {
    story: 'components-textarea--default',
    axes: { size: ['m'] },
    states: ['default', 'hover', 'focus', 'invalid', 'disabled'],
    args: (v, s) => ({ label: 'Label', size: v.size!, placeholder: 'Placeholder', invalid: s === 'invalid', disabled: s === 'disabled' }),
    parts: { '(root)': { part: 'textarea-wrapper', fill: true, stroke: true }, 'textarea-field': { part: 'textarea-field', placeholder: true } },
    target: 'textarea-field',
    storyFor: { disabled: 'components-textarea--disabled' }, // the Default story ignores a URL `disabled` arg
  },
  Button: {
    story: 'components-button--full-width',
    axes: { variant: ['primary', 'secondary', 'ghost', 'danger'], size: ['m'] },
    states: ['default', 'hover', 'press', 'focus', 'disabled', 'loading'],
    args: (v, s) => ({ children: 'Label', variant: v.variant!, size: v.size!, fullWidth: false, disabled: s === 'disabled', isLoading: s === 'loading' }),
    parts: { '(root)': { part: 'button', fill: true, stroke: true }, 'text': { part: 'button-label', text: true } },
    target: 'button',
  },
  IconButton: {
    story: 'components-iconbutton--primary',
    axes: { variant: ['primary', 'secondary', 'ghost', 'danger'], size: ['m'] },
    states: ['default', 'hover', 'press', 'focus', 'disabled', 'loading'],
    args: (v, s) => ({ variant: v.variant!, size: v.size!, disabled: s === 'disabled', isLoading: s === 'loading' }),
    parts: { '(root)': { part: 'icon-button', fill: true, stroke: true } },
    target: 'icon-button',
  },
  Select: {
    story: 'components-select--default',
    axes: {},
    states: ['default', 'hover', 'focus', 'open', 'invalid', 'disabled'],
    args: (v, s) => ({ label: 'Role', placeholder: 'Choose a role…', invalid: s === 'invalid', disabled: s === 'disabled' }),
    parts: { '(root)': { part: 'select-trigger', fill: true, stroke: true }, 'select-trigger-label': { part: 'select-trigger-label', text: true } },
    target: 'select-trigger',
  },
  Checkbox: {
    story: 'components-checkbox--all-types',
    axes: { checked: ['unchecked', 'checked', 'indeterminate'] },
    states: ['default', 'hover', 'focus', 'invalid', 'disabled'],
    args: () => ({}),
    parts: { 'checkbox-control': { part: 'checkbox-control', fill: true, stroke: true }, 'checkbox-text': { part: 'checkbox-text', text: true } },
    target: 'checkbox-label',
    focusTarget: 'checkbox-input',
    // All Types = unchecked, checked, indeterminate · Disabled = unchecked, checked · Invalid = unchecked
    locate: (v, state) => {
      const nth = (n: number) => `[data-helix-part="checkbox-root"]:nth-of-type(${n})`;
      const i = ['unchecked', 'checked', 'indeterminate'].indexOf(v.checked!) + 1;
      if (state === 'disabled') return i <= 2 ? { story: 'components-checkbox--disabled', scope: nth(i) } : null;
      if (state === 'invalid') return i === 1 ? { story: 'components-checkbox--invalid', scope: nth(1) } : null;
      return { story: 'components-checkbox--all-types', scope: nth(i) };
    },
  },
  RadioGroup: {
    story: 'components-radiogroup--default',
    axes: { checked: ['unchecked', 'checked'] },
    states: ['default', 'hover', 'focus', 'invalid', 'disabled'],
    args: () => ({}),
    parts: { 'radio-control': { part: 'radio-control', fill: true, stroke: true }, 'radio-item-label': { part: 'radio-item-label', text: true } },
    target: 'radio-item',
    focusTarget: 'radio-input',
    // Default/Invalid/Disabled stories: the 1st option is unchecked, the 2nd checked (Default/Disabled)
    locate: (v, state) => {
      const nth = (n: number) => `[data-helix-part="radio-item"]:nth-of-type(${n})`;
      const i = v.checked === 'checked' ? 2 : 1;
      if (state === 'disabled') return { story: 'components-radiogroup--disabled', scope: nth(i) };
      if (state === 'invalid') return v.checked === 'unchecked' ? { story: 'components-radiogroup--invalid', scope: nth(1) } : null;
      return { story: 'components-radiogroup--default', scope: nth(i) };
    },
  },
  Switch: {
    story: 'components-switch--default',
    axes: { checked: ['unchecked', 'checked'] },
    states: ['default', 'hover', 'focus', 'disabled'],
    args: () => ({}),
    parts: {
      'switch-track': { part: 'switch-track', fill: true },
      'switch-thumb': { part: 'switch-thumb', fill: true },
      'switch-label': { part: 'switch-label', text: true },
    },
    target: 'switch-track',
    // Default = unchecked, Checked = checked (both one switch, render-controlled) · Disabled = off, on
    locate: (v, state) => {
      if (state === 'disabled') return { story: 'components-switch--disabled', scope: `[data-helix-part="switch-root"]:nth-of-type(${v.checked === 'checked' ? 2 : 1})` };
      return { story: v.checked === 'checked' ? 'components-switch--checked' : 'components-switch--default', scope: '[data-helix-part="switch-root"]' };
    },
  },
  Card: {
    story: 'components-card--default',
    axes: { padding: ['default', 'none'] },
    states: ['default'],
    args: v => ({ padding: v.padding, showHeader: true }),
    parts: {
      '(root)': { part: 'card-root', fill: true, stroke: true },
      'card-header': { part: 'card-header', text: true },
      'card-body': { part: 'card-body', text: true },
    },
    target: 'card-root',
  },
  NavItem: {
    story: 'components-navitem--default',
    axes: { current: ['false', 'true'] },
    states: ['default', 'hover', 'focus'],
    args: v => ({ current: v.current === 'true' }),
    // current's fill is on nav-item-indicator (the sliding motion.span); Figma puts it on the root
    parts: {
      '(root)': { part: 'nav-item', fill: true },
      'nav-item-indicator': { part: 'nav-item-indicator', fill: true },
      'nav-item-icon': { part: 'nav-item-icon', text: true },
      'nav-item-label': { part: 'nav-item-label', text: true },
    },
    target: 'nav-item',
  },
  Avatar: {
    story: 'components-avatar--default',
    axes: { size: ['s', 'm', 'l'] },
    states: ['default'],
    args: v => ({ size: v.size }),
    parts: { '(root)': { part: 'avatar-root', fill: true }, 'avatar-initials': { part: 'avatar-initials', text: true } },
    target: 'avatar-root',
  },
  PageHeader: {
    story: 'layout-pageheader--default',
    axes: { level: ['1', '2'] },
    states: ['default'],
    args: v => ({ level: Number(v.level) as unknown as string }),
    parts: { 'page-header-title': { part: 'page-header-title', text: true }, 'page-header-description': { part: 'page-header-description', text: true } },
    target: 'page-header-root',
  },
  Badge: {
    story: 'components-badge--all-variants',
    axes: { variant: ['neutral', 'info', 'success', 'warning', 'danger'], size: ['s'] },
    states: ['default'],
    args: () => ({}),
    parts: { '(root)': { part: 'badge', fill: true, stroke: true }, 'badge-label': { part: 'badge-label', text: true } },
    target: 'badge',
    scope: v => `[data-helix-part="badge"][data-variant="${v.variant}"]`,
  },
  Accordion: {
    story: 'components-accordion--default',
    axes: { expanded: ['false', 'true'] },
    states: ['default', 'focus', 'disabled'],
    args: (v, s) => ({ defaultExpanded: v.expanded === 'true', disabled: s === 'disabled' }),
    parts: {
      '(root)': { part: 'accordion-root', fill: true, stroke: true },
      'accordion-title': { part: 'accordion-title', text: true },
      'accordion-chevron': { part: 'accordion-chevron', text: true },
    },
    target: 'accordion-header',
  },
  AvatarGroup: {
    story: 'components-avatargroup--with-overflow',
    axes: { size: ['s', 'm', 'l'] },
    states: ['default'],
    args: v => ({ size: v.size! }),
    parts: { '(root)': { part: 'avatar-group-root' }, 'avatar-group-overflow': { part: 'avatar-group-overflow', fill: true }, 'count': { part: 'avatar-group-overflow', text: true } },
    target: 'avatar-group-root',
  },
  CheckboxGroup: {
    story: 'components-checkboxgroup--default',
    axes: { orientation: ['vertical', 'horizontal'] },
    states: ['default', 'invalid', 'disabled'],
    args: (v, s) => ({ orientation: v.orientation!, invalid: s === 'invalid', errorMessage: s === 'invalid' ? 'Choose at least one.' : '', disabled: s === 'disabled' }),
    parts: { '(root)': { part: 'checkbox-group' }, 'legend': { part: 'checkbox-group-legend', text: true } },
    target: 'checkbox-group',
  },
  FAB: {
    story: 'components-fab--default',
    axes: { expanded: ['false', 'true'] },
    states: ['default', 'hover', 'press', 'focus', 'disabled'],
    args: (v, s) => ({ disabled: s === 'disabled' }),
    parts: { 'fab-root': { part: 'fab-root', fill: true }, 'fab-icon': { part: 'fab-icon', text: true } },
    target: 'fab-root',
    locate: (v, s) => v.expanded === 'true' ? (s === 'default' ? { story: 'components-fab--expanded', scope: '[data-helix-part="fab-root-wrapper"]' } : null)
      : { story: s === 'disabled' ? 'components-fab--disabled' : 'components-fab--default', scope: '[data-helix-part="fab-root-wrapper"]' },
  },
  MultiSelect: {
    story: 'components-multiselect--default',
    axes: { value: ['empty', 'selected'] },
    states: ['default', 'hover', 'focus', 'open', 'invalid', 'disabled'],
    args: () => ({}),
    parts: { '(root)': { part: 'multi-select-field', fill: true, stroke: true }, 'multi-select-placeholder': { part: 'multi-select-placeholder', text: true }, 'multi-select-chevron': { part: 'multi-select-chevron', text: true } },
    target: 'multi-select-trigger',
    borderOutsideLayout: true,
    locate: (v, s) => {
      const scope = '[data-helix-part="multi-select-root"]';
      if (v.value === 'selected') return ['invalid', 'disabled'].includes(s) ? null : { story: 'components-multiselect--with-selection', scope };
      return { story: s === 'invalid' ? 'components-multiselect--invalid' : s === 'disabled' ? 'components-multiselect--disabled' : 'components-multiselect--default', scope };
    },
  },
  RadioButton: {
    story: 'components-radiobutton--all-types',
    axes: { checked: ['unchecked', 'checked'] },
    states: ['default', 'hover', 'focus', 'invalid', 'disabled'],
    args: () => ({}),
    parts: { 'radio-control': { part: 'radio-control', fill: true, stroke: true }, 'radio-item-label': { part: 'radio-item-label', text: true } },
    target: 'radio-item',
    focusTarget: 'radio-input',
    locate: (v, s) => {
      const nth = (n: number) => `[data-helix-part="radio-item"]:nth-of-type(${n})`;
      const i = v.checked === 'checked' ? 2 : 1;
      if (s === 'disabled') return { story: 'components-radiobutton--disabled', scope: nth(i) };
      if (s === 'invalid') return v.checked === 'unchecked' ? { story: 'components-radiobutton--invalid', scope: nth(1) } : null;
      return { story: 'components-radiobutton--all-types', scope: nth(i) };
    },
  },
  SegmentedControlItem: {
    story: 'components-segmentedcontrol--default',
    axes: { checked: ['false', 'true'] },
    states: ['default', 'hover', 'focus', 'disabled'],
    args: () => ({}),
    parts: { 'segmented-control-item-label': { part: 'segmented-control-item-label', text: true } },
    target: 'segmented-control-item',
    locate: (v, s) => {
      const sel = v.checked === 'true' ? '[data-helix-part="segmented-control-item"][aria-checked="true"]' : '[data-helix-part="segmented-control-item"][aria-checked="false"]';
      return { story: s === 'disabled' ? 'components-segmentedcontrol--disabled' : 'components-segmentedcontrol--default', scope: sel };
    },
  },
  Tooltip: {
    story: 'components-tooltip--always-expanded',
    axes: {},
    states: ['default'],
    args: () => ({}),
    parts: { '(root)': { part: 'tooltip-content', fill: true }, 'tooltip-label': { part: 'tooltip-content', text: true } },
    target: 'tooltip-content',
  },
  MenuItem: {
    story: 'components-menu--states',
    axes: {},
    states: ['default', 'hover', 'selected', 'disabled'],
    args: () => ({}),
    parts: { '(root)': { part: 'menu-item', fill: true }, 'menu-item-label': { part: 'menu-item', text: true } }, // the label span only renders next to a labelEnd
    target: 'menu-item',
    layoutPerState: true,
    locate: (_v, s) => ({
      story: 'components-menu--states',
      scope: s === 'selected' ? '[data-helix-part="menu-item"][aria-selected="true"]'
        : s === 'disabled' ? '[data-helix-part="menu-item"]:disabled'
        : '[data-helix-part="menu-item"]:not([aria-selected="true"]):not(:disabled)',
    }),
  },
  // Overlays: their Opened stories open them in a play function that only clicks the trigger (it never
  // fails), so measuring after it is safe.
  Modal: {
    story: 'components-modal--opened',
    axes: {},
    states: ['default'],
    args: () => ({}),
    parts: { '(root)': { part: 'modal-root', fill: true }, 'modal-title': { part: 'modal-title', text: true }, 'modal-body': { part: 'modal-body', text: true } },
    target: 'modal-root',
    scope: () => '[data-helix-part="modal-root"][open]',
  },
  SidePanel: {
    story: 'components-sidepanel--opened',
    axes: { placement: ['right'] },
    states: ['default'],
    args: () => ({}),
    parts: { '(root)': { part: 'side-panel-root', fill: true }, 'side-panel-title': { part: 'side-panel-title', text: true }, 'side-panel-body': { part: 'side-panel-body', text: true } },
    target: 'side-panel-root',
    scope: () => '[data-helix-part="side-panel-root"][open]',
  },
  Toast: {
    story: 'components-toast--opened',
    axes: { variant: ['success', 'danger'] },
    states: ['default'],
    args: () => ({}),
    parts: { '(root)': { part: 'toast', fill: true, stroke: true }, 'toast-icon': { part: 'toast-icon', text: true }, 'toast-title': { part: 'toast-title', text: true }, 'toast-description': { part: 'toast-description', text: true } },
    target: 'toast',
    scope: v => `[data-helix-part="toast"][data-variant="${v.variant}"]`,
  },
};

const toHex = (css: string): string => {
  if (!css || css === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(css)) return 'none';
  let m = css.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return '#' + m.slice(1, 4).map(x => Number(x).toString(16).padStart(2, '0')).join('');
  m = css.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
  if (m) return '#' + m.slice(1, 4).map(x => Math.round(Number(x) * 255).toString(16).padStart(2, '0')).join('');
  return css;
};

async function measure(page: Page, spec: Spec, v: Record<string, string>, state: State, theme: 'light' | 'dark') {
  const scope = spec.scope ? spec.scope(v) : null;
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  await page.mouse.move(0, 0);
  const scoped = scope ? page.locator(scope).first() : null;
  const target = !scoped ? page.locator(`[data-helix-part="${spec.target}"]`).first()
    : (await scoped.evaluate((el, t) => el.matches(`[data-helix-part="${t}"]`), spec.target)) ? scoped
    : scoped.locator(`[data-helix-part="${spec.target}"]`).first(); // e.g. the chip button inside chip-shell
  if (state === 'hover' || state === 'press') {
    const box = await target.boundingBox(); // a real pointer move — locator.hover() can stall on Storybook's own overlays
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  }
  if (state === 'press') await page.mouse.down();
  if (state === 'focus') { await page.keyboard.press('Shift'); await (spec.focusTarget ? (scoped ?? page).locator(`[data-helix-part="${spec.focusTarget}"]`).first() : target).focus(); }
  if (state === 'open') { await page.keyboard.press('Escape'); await target.click(); } // e.g. Select: a real click opens the menu (closed first — the other theme's pass left it open)
  await page.waitForTimeout(350); // let CSS transitions finish
  const raw = await page.evaluate(({ parts, scope }) => {
    const root: ParentNode = (scope && document.querySelector(scope)?.parentElement) || document;
    const out: Record<string, Record<string, string>> = {};
    for (const [layer, p] of Object.entries(parts)) {
      const el = scope && document.querySelector(scope)?.matches(`[data-helix-part="${p.part}"]`) ? document.querySelector(scope) : (scope ? document.querySelector(scope)?.querySelector(`[data-helix-part="${p.part}"]`) : root.querySelector(`[data-helix-part="${p.part}"]`));
      if (!el) continue;
      const cs = getComputedStyle(el);
      out[layer] = {};
      if (p.fill) out[layer]!.fill = cs.backgroundColor;
      if (p.stroke) out[layer]!.stroke = parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : 'transparent';
      // a Figma TEXT layer's fill is its text color; an icon part's is its svg's (Icon can set its own color)
      const svg = /icon|chevron/.test(p.part) ? el.querySelector('svg') : null;
      // Tabler's `color` prop is the svg's stroke attribute (currentColor unless Icon is given a color)
      // (filled icons, e.g. Toast's, carry it in fill instead)
      const paint = svg ? [getComputedStyle(svg).stroke, getComputedStyle(svg).fill].find(x => /^rgb|^color/.test(x)) : undefined;
      if (p.text) out[layer]!.fill = svg ? (paint ?? getComputedStyle(svg).color) : cs.color;
      if (p.placeholder) out[layer]!.fill = getComputedStyle(el, '::placeholder').color; // the Figma layer shows placeholder text
    }
    return out;
  }, { parts: spec.parts, scope });
  if (state === 'press') await page.mouse.up();
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([p, c]) => [p, toHex(c)]))]));
}

// ── Layout ──────────────────────────────────────────────────────────────────
type Measured = { value: number | string; token: string | null; figma: string | null };
const BOX = { height: 'height', paddingTop: 'padding-top', paddingRight: 'padding-right', paddingBottom: 'padding-bottom', paddingLeft: 'padding-left', itemSpacing: 'gap', cornerRadius: 'border-top-left-radius' } as const;
const ICON = { width: 'width', height: 'height' } as const;
const TYPE = { fontSize: 'font-size', lineHeight: 'line-height', fontWeight: 'font-weight', fontFamily: 'font-family' } as const;

// The declared value of `prop` in a shorthand: padding 1–4 values, gap row/column, border-radius' first corner.
function fromShorthand(shorthand: string, value: string, prop: string): string | undefined {
  const parts = value.match(/(?:[^\s(]+|\([^)]*\))+/g) ?? [];
  const at = (i: number) => parts[i] ?? parts[0];
  if (shorthand === 'padding') {
    const [t, r = t, b = t, l = r] = parts;
    return { 'padding-top': t, 'padding-right': r, 'padding-bottom': b, 'padding-left': l }[prop];
  }
  if (shorthand === 'gap' && (prop === 'row-gap' || prop === 'column-gap')) return prop === 'row-gap' ? at(0) : at(1);
  if (shorthand === 'border-radius' && prop === 'border-top-left-radius') return at(0);
  return undefined;
}
const SHORTHAND: Record<string, string> = { 'padding-top': 'padding', 'padding-right': 'padding', 'padding-bottom': 'padding', 'padding-left': 'padding', 'row-gap': 'gap', 'column-gap': 'gap', 'border-top-left-radius': 'border-radius' };

/** Which --helix-* variable sets `prop` on the element marked [data-figma-measure]: every declaration the
 *  cascade matched for it (inline first, then the most specific rule), and the first whose value — resolved
 *  on that element — equals the computed one. Checking the value makes the answer right whatever the
 *  cascade order (layers, specificity) the protocol lists rules in. */
async function declaredVar(page: Page, cdp: CDPSession, prop: string): Promise<string | null> {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-figma-measure]' });
  if (!nodeId) return null;
  const matched: any = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
  const styles = [matched.inlineStyle, ...[...(matched.matchedCSSRules ?? [])].reverse().map((m: any) => m.rule.style)].filter(Boolean);
  const candidates: string[] = [];
  for (const st of styles) for (const cp of st.cssProperties ?? []) {
    if (cp.disabled || cp.parsedOk === false || !cp.value?.includes('var(')) continue;
    if (cp.name === prop) candidates.push(cp.value);
    else if (SHORTHAND[prop] === cp.name) { const v = fromShorthand(cp.name, cp.value, prop); if (v?.includes('var(')) candidates.push(v); }
  }
  for (const c of candidates) {
    const same = await page.evaluate(({ prop, c }) => {
      const el = document.querySelector('[data-figma-measure]') as HTMLElement;
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;display:block';
      probe.style.setProperty(prop, c.replace(/ !important$/, ''));
      el.appendChild(probe);
      const got = getComputedStyle(probe).getPropertyValue(prop);
      probe.remove();
      return got === getComputedStyle(el).getPropertyValue(prop);
    }, { prop, c });
    const v = c.match(/var\((--helix-[\w-]+)/)?.[1];
    if (same && v) return v;
  }
  return null;
}

async function measureLayout(page: Page, cdp: CDPSession, spec: Spec, scope: string | null) {
  const out: Record<string, Record<string, Measured | string>> = {};
  for (const [layer, p] of Object.entries(spec.parts)) {
    const isIcon = /icon|chevron|indicator-mark/.test(p.part); // a chevron is an icon too (Accordion, Select, MultiSelect)
    const kinds = { box: layer === '(root)', icon: isIcon, type: !!(p.text || p.placeholder) && !isIcon };
    if (!kinds.box && !kinds.icon && !kinds.type) continue;
    const found = await page.evaluate(({ part, scope }) => {
      document.querySelectorAll('[data-figma-measure]').forEach(e => e.removeAttribute('data-figma-measure'));
      const sc = scope ? document.querySelector(scope) : null;
      const el = sc?.matches(`[data-helix-part="${part}"]`) ? sc : (sc ?? document).querySelector(`[data-helix-part="${part}"]`);
      if (!el) return false;
      el.setAttribute('data-figma-measure', '');
      return true;
    }, { part: p.part, scope });
    if (!found) continue;
    const props: Record<string, string> = { ...(kinds.box ? BOX : {}), ...(kinds.icon ? ICON : {}), ...(kinds.type ? TYPE : {}) };
    const entry: Record<string, Measured | string> = {};
    for (const [figmaProp, cssProp0] of Object.entries(props)) {
      // Figma's itemSpacing is the gap along the auto-layout direction
      const cssProp = cssProp0 === 'gap'
        ? (await page.evaluate(() => getComputedStyle(document.querySelector('[data-figma-measure]')!).flexDirection)).startsWith('column') ? 'row-gap' : 'column-gap'
        : cssProp0;
      const raw = await page.evaluate(cp => getComputedStyle(document.querySelector('[data-figma-measure]')!).getPropertyValue(cp), cssProp);
      const value = cssProp === 'font-family' ? raw.split(',')[0]!.replace(/["']/g, '').trim()
        : cssProp === 'font-weight' ? Number(raw)
        : /px$/.test(raw) ? Math.round(parseFloat(raw) * 100) / 100 : raw === 'normal' ? 0 : raw;
      if (figmaProp === 'height' && kinds.box) {
        // Only a height the CSS SETS is a spec; a content-driven height (a Card) isn't compared.
        if (!(await declaredVar(page, cdp, 'height')) && !(await declaredVar(page, cdp, 'min-height'))) continue;
      }
      if (typeof value === 'number' && value === 0 && figmaProp !== 'fontWeight') continue; // nothing to bind
      let v = await declaredVar(page, cdp, cssProp);
      if (!v && figmaProp in TYPE) {
        // Inherited: the font is often set on the control (button), not the label inside it — climb until a
        // declaration sets it, then put the marker back.
        for (let up = 1; up <= 8 && !v; up++) {
          const moved = await page.evaluate(n => {
            const el = document.querySelector('[data-figma-measure]')!;
            let a: Element | null = el; for (let i = 0; i < n; i++) a = a?.parentElement ?? null;
            if (!a) return false;
            el.setAttribute('data-figma-origin', ''); el.removeAttribute('data-figma-measure'); a.setAttribute('data-figma-measure', '');
            return true;
          }, up);
          if (!moved) break;
          v = await declaredVar(page, cdp, cssProp);
          await page.evaluate(() => {
            document.querySelector('[data-figma-measure]')?.removeAttribute('data-figma-measure');
            const o = document.querySelector('[data-figma-origin]')!; o.removeAttribute('data-figma-origin'); o.setAttribute('data-figma-measure', '');
          });
        }
      }
      const chain = v ? tokenChain(v) : [];
      entry[figmaProp] = { value, token: chain[0] ?? null, figma: figmaTarget(chain, kinds.type && figmaProp in TYPE ? 'textStyle' : 'variable') };
    }
    if (kinds.type) {
      // The weight decides between two styles of the same size (MenuItem selected: regular's size, medium's weight)
      const fw = entry.fontWeight;
      const style = (typeof fw === 'object' && fw.figma) || Object.values(entry).map(e => (typeof e === 'object' ? e.figma : null)).find(Boolean);
      if (style) entry.textStyle = style; // the named Text Style the layer must use
    }
    out[layer] = entry;
  }
  return out;
}

async function main() {
  const name = process.argv[2];
  const spec = name ? SPECS[name] : undefined;
  if (!spec) { console.error(`Usage: pnpm figma:expected <${Object.keys(SPECS).join('|')}>`); process.exit(1); }
  const url = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const combos = Object.entries(spec.axes).reduce<Record<string, string>[]>((acc, [k, vals]) => acc.flatMap(a => vals.map(v => ({ ...a, [k]: v }))), [{}]);
  const colors: Record<string, { light: unknown; dark: unknown }> = {};
  const layout: Record<string, unknown> = {};
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  for (const v of combos) for (const state of spec.states) {
    const loc = spec.locate ? spec.locate(v, state) : undefined;
    if (loc === null) continue; // combo not shown in any story
    const args = Object.entries(spec.args(v, state)).map(([k, x]) => `${k}:${typeof x === 'boolean' ? '!' + x : x}`).join(';');
    const storyId = loc?.story ?? spec.storyFor?.[state] ?? spec.story;
    await page.goto(`${url}/iframe.html?viewMode=story&id=${storyId}&args=${encodeURIComponent(loc ? '' : args)}`);
    const scopeSel = loc?.scope ?? (spec.scope ? spec.scope(v) : null);
    const vScoped = loc ? { ...spec, scope: () => loc.scope } : spec;
    await page.waitForSelector(scopeSel ?? `[data-helix-part="${spec.target}"]`, { state: 'attached' });
    const variantName = [...Object.entries(v).map(([k, x]) => `${k}=${x}`), ...(spec.states.length > 1 ? [`state=${state}`] : [])].join(', ');
    colors[variantName] = { light: await measure(page, vScoped, v, state, 'light'), dark: await measure(page, vScoped, v, state, 'dark') };
    // Layout doesn't change by state or theme: measured once per variant, at its first state, light.
    const layoutKey = spec.layoutPerState ? variantName : Object.entries(v).map(([k, x]) => `${k}=${x}`).join(', ');
    if (!(layoutKey in layout) && (spec.layoutPerState || state === spec.states[0])) {
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await page.waitForTimeout(200);
      // CSS.enable only reports stylesheets parsed after it: re-enable on each new page.
      await cdp.send('CSS.disable').catch(() => {}); await cdp.send('CSS.enable');
      layout[layoutKey] = await measureLayout(page, cdp, vScoped, scopeSel);
    }
  }
  await browser.close();
  const out = path.resolve(__dirname, '../../.ai/figma-expected', `${name}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ $comment: `Generated by pnpm figma:expected ${name} from Storybook computed styles — do not hand-edit.`, states: spec.states, ...(spec.borderOutsideLayout ? { borderOutsideLayout: true } : {}), colors, layout }, null, 2) + '\n');
  const props = Object.values(layout).flatMap(l => Object.values(l as object).flatMap(e => Object.values(e as object))).filter(x => typeof x === 'object');
  console.log(`✅ ${path.relative(process.cwd(), out)} — ${Object.keys(colors).length} variants × light/dark colors; ${props.length} layout values (${props.filter((x: any) => x.token).length} from a token)`);
}
main();
