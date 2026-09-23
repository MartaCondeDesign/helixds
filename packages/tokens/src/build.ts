/**
 * Helix DS token build pipeline
 * DTCG JSON (3 layers) → CSS custom properties + TypeScript constants
 *
 * Layer naming → CSS var:
 *   primitive.color.blue.600    → --helix-primitive-color-blue-600
 *   semantic.color.fill.primary-interactive-default → --helix-color-fill-primary-interactive-default
 *   component.button.fill.primary-default → --helix-button-fill-primary-default
 *
 * Run: pnpm --filter @helix-ds/tokens build
 */
import fs from 'fs';
import path from 'path';

const tokens = JSON.parse(
  fs.readFileSync(new URL('./tokens.json', import.meta.url), 'utf-8'),
) as Record<string, unknown>;

const dist = path.resolve(import.meta.dirname, '../dist');
fs.mkdirSync(dist, { recursive: true });

// ─── Types ────────────────────────────────────────────────────────────────────

// $value is usually a leaf (string/number). A DTCG composite token (e.g. $type: "typography" —
// semantic.textStyle.*) instead holds an object of named sub-properties, each itself an alias
// string ({primitive.fontSize.s}) — see the composite handling in flatten()/buildTs() below.
type TokenNode = { $value: string | number | Record<string, string>; $type: string; $description?: string };

function isComposite(value: TokenNode['$value']): value is Record<string, string> {
  return typeof value === 'object' && value !== null;
}
type Tree = Record<string, unknown>;
type CSSVar = { name: string; value: string; layer: 'primitive' | 'semantic' | 'component'; description?: string };

// ─── Resolve DTCG references ({a.b.c} → value) ───────────────────────────────

function resolveRef(value: string, root: Tree): string {
  if (typeof value !== 'string' || !value.startsWith('{')) return value;
  const refPath = value.slice(1, -1).split('.');
  let node: unknown = root;
  for (const key of refPath) {
    // Composite token ($value is an object, e.g. semantic.textStyle.*) reached with path segments
    // still remaining — those segments index into $value (fontSize/fontWeight/...), not the token
    // node itself, since a composite's sub-properties live one level deeper than a normal leaf's.
    if (node && typeof node === 'object' && '$value' in node && isComposite((node as TokenNode).$value)) {
      node = ((node as TokenNode).$value as Record<string, unknown>)[key];
      continue;
    }
    if (typeof node !== 'object' || node === null) {
      throw new Error(`Cannot resolve token: ${value} — failed at key '${key}'`);
    }
    node = (node as Record<string, unknown>)[key];
  }
  if (typeof node === 'string') return resolveRef(node, root); // landed on a composite sub-property's alias/literal
  if (typeof node === 'object' && node !== null && '$value' in node) {
    const t = node as TokenNode;
    if (isComposite(t.$value)) {
      throw new Error(`Token reference ${value} resolved to a composite token — reference one of its sub-properties instead.`);
    }
    return resolveRef(String(t.$value), root);
  }
  throw new Error(`Token reference ${value} did not resolve to a leaf token`);
}

// ─── Flatten tree to CSS vars ─────────────────────────────────────────────────

function flatten(obj: Tree, root: Tree, prefix: string[], layer: CSSVar['layer']): CSSVar[] {
  return Object.entries(obj).flatMap(([key, val]) => {
    if (key.startsWith('$')) return [];
    const node = val as Tree;
    if ('$value' in node) {
      const token = node as unknown as TokenNode;

      // CSS name strategy per layer:
      // primitive.*  → --helix-primitive-{path}
      // semantic.*   → --helix-{path} (strip 'semantic.' prefix)
      // component.*  → --helix-{path} (strip 'component.' prefix)
      const basePrefix = layer === 'primitive' ? ['primitive', ...prefix] : prefix;

      if (isComposite(token.$value)) {
        // One CSS var per sub-property — e.g. semantic.textStyle.body-s-medium.fontSize →
        // --helix-textStyle-body-s-medium-fontSize. Each sub-value is itself an alias string.
        return Object.entries(token.$value).map(([subKey, subVal]) => {
          const name = '--helix-' + [...basePrefix, key, subKey].join('-').replace(/\./g, '-');
          return { name, value: resolveRef(subVal, root), layer, description: token.$description };
        });
      }

      const rawValue = typeof token.$value === 'string'
        ? resolveRef(token.$value, root)
        : String(token.$value);
      const name = '--helix-' + [...basePrefix, key].join('-').replace(/\./g, '-');
      return [{ name, value: rawValue, layer, description: token.$description }];
    }
    return flatten(node, root, [...prefix, key], layer);
  });
}

// ─── Extract by layer ─────────────────────────────────────────────────────────

const primitiveVars = flatten(tokens['primitive'] as Tree, tokens, [], 'primitive');
const semanticVars  = flatten(tokens['semantic']  as Tree, tokens, [], 'semantic');
const componentVars = flatten(tokens['component'] as Tree, tokens, [], 'component');

const allVars = [...primitiveVars, ...semanticVars, ...componentVars];

// ─── Dark mode semantic overrides (light → dark mapping) ─────────────────────

const darkOverrides: Record<string, string> = {
  '--helix-color-fill-page':             '#0f172a',
  '--helix-color-fill-surface':          '#1e293b',
  '--helix-color-fill-surface-dark':     '#334155',
  '--helix-color-fill-secondary-interactive-default': '#1e293b',
  '--helix-color-fill-secondary-interactive-hover':   '#334155',
  '--helix-color-fill-secondary-interactive-press':   '#475569',
  '--helix-color-fill-disabled':         '#1e293b',
  '--helix-color-text-neutral':     '#f1f5f9',
  '--helix-color-text-neutral-light':    '#94a3b8',
  '--helix-color-text-neutral-lightest': '#64748b',
  '--helix-color-text-disabled':         '#475569',
  '--helix-color-text-inverse':          '#0f172a',
  '--helix-color-text-primary':          '#60a5fa',
  '--helix-color-text-link':       '#60a5fa',
  '--helix-color-text-link-hover': '#93c5fd',
  '--helix-color-icon-neutral':     '#f1f5f9',
  '--helix-color-icon-neutral-light':    '#94a3b8',
  '--helix-color-icon-neutral-lightest': '#64748b',
  '--helix-color-icon-disabled':         '#475569',
  '--helix-color-icon-inverse':          '#0f172a',
  '--helix-color-icon-primary':          '#60a5fa',
  '--helix-color-border-neutral':        '#334155',
  '--helix-color-border-neutral-dark':   '#475569',
  '--helix-color-border-neutral-light':  '#1e293b',
  '--helix-color-border-inverse':        '#94a3b8',
  '--helix-input-fill-default':             '#1e293b',
  '--helix-input-fill-disabled':         '#0f172a',
  '--helix-input-text-value':            '#f1f5f9',
  '--helix-input-text-placeholder':      '#64748b',
  '--helix-input-text-disabled':         '#475569',
  '--helix-input-text-label':            '#f1f5f9',
  '--helix-input-text-description':      '#94a3b8',
  '--helix-input-icon-default':          '#94a3b8',
  '--helix-input-border-default':           '#334155',
  '--helix-input-border-hover':          '#475569',
  '--helix-input-border-invalid':        '#f87171',
  '--helix-card-fill':                   '#0f172a',
  '--helix-card-border':                 '#334155',
  '--helix-avatarGroup-ring':            '#0f172a',
  '--helix-modal-fill':                  '#1e293b',
  '--helix-modal-text':                  '#f1f5f9',
  // SidePanel/Toast: floating, shadowed surfaces (ADR-005) — same "surface" dark tone as Modal, not
  // page's own dark value, so they stay visually distinct from the page behind them in dark mode
  // instead of nearly disappearing except for their shadow.
  '--helix-sidePanel-fill':              '#1e293b',
  '--helix-sidePanel-text':              '#f1f5f9',
  '--helix-toast-fill':                  '#1e293b',
  '--helix-toast-text':                  '#f1f5f9',
  '--helix-toast-textDescription':       '#94a3b8',
  // Decoupled from --helix-badge-icon-* on purpose (ADR-011 amendment) — Toast sits on a plain
  // fill.page background, not a saturated colored fill like Badge, so its icon can stay noticeably
  // darker/more saturated in dark mode without failing contrast. Each verified >=3:1 (icon threshold)
  // against Toast's own dark fill (#1e293b): info .600 3.57:1, success .600 4.44:1, warning .600
  // 4.59:1, danger .500 3.89:1 (danger .600 was only 3.03:1, too tight a margin).
  '--helix-toast-icon-neutral':          '#94a3b8',
  '--helix-toast-icon-info':             '#0284c7',
  '--helix-toast-icon-success':          '#16a34a',
  '--helix-toast-icon-warning':          '#d97706',
  '--helix-toast-icon-danger':           '#ef4444',
  // Accordion: no shadow, not elevated (blends with the page, same as Card) — page's own dark tone.
  '--helix-accordion-fill':              '#0f172a',
  '--helix-accordion-text':              '#f1f5f9',
  '--helix-accordion-border':            '#334155',
  '--helix-accordion-chevron':           '#94a3b8',
  '--helix-button-fill-secondary-default':  '#1e293b',
  '--helix-button-fill-secondary-hover': '#334155',
  '--helix-button-text-secondary':       '#f1f5f9',
  '--helix-button-text-ghost':           '#f1f5f9',
  '--helix-button-icon-secondary':       '#f1f5f9',
  '--helix-button-icon-ghost':           '#f1f5f9',
  '--helix-select-fill-default':            '#1e293b',
  '--helix-select-fill-disabled':        '#0f172a',
  '--helix-select-text-value':           '#f1f5f9',
  '--helix-select-text-placeholder':     '#64748b',
  '--helix-select-text-disabled':        '#475569',
  '--helix-select-text-label':           '#f1f5f9',
  '--helix-select-text-description':     '#94a3b8',
  '--helix-select-text-error':           '#fca5a5',
  '--helix-select-icon-default':         '#94a3b8',
  '--helix-select-border-default':          '#334155',
  '--helix-select-border-hover':         '#475569',
  '--helix-select-border-focus':         '#60a5fa',
  '--helix-select-border-invalid':       '#f87171',
  '--helix-select-border-disabled':      '#334155',
  // Menu keeps fill.page's OWN dark value (#0f172a) rather than the "elevated surface" tone
  // (#1e293b) Toast/Modal/SidePanel use — deliberately, because its item-hover reuses the shared
  // fill.secondary-interactive-default token (#1e293b, the same one NavItem's hover already
  // resolves to), and hover needs to read as visibly lighter than the menu's own background. Using
  // the surface tone for both would make hover disappear (same color as its own container).
  '--helix-menu-fill':                   '#0f172a',
  '--helix-menu-border':                 '#334155',
  '--helix-menu-groupLabel-text':        '#64748b',
  '--helix-menu-item-fill-hover':        '#1e293b',
  '--helix-menu-item-fill-selected':     '#1e3a8a',
  '--helix-menu-item-text':              '#f1f5f9',
  // NOT text.primary's own dark value (#60a5fa) — that only passes 4.07:1 against fill-selected's
  // dark value (#1e3a8a), under the 4.5:1 text minimum. In dark mode fill-selected is a solid navy,
  // not light mode's light tint, so it needs inverse (white) text, same convention Button/Badge
  // already use for text on a solid colored fill — not another blue-on-blue.
  '--helix-menu-item-text-selected':     '#ffffff',
  '--helix-menu-item-text-disabled':     '#475569',
  '--helix-menu-groupDivider-color':     '#334155',
  '--helix-textarea-fill-default':          '#1e293b',
  '--helix-textarea-fill-disabled':      '#0f172a',
  '--helix-textarea-text-value':         '#f1f5f9',
  '--helix-textarea-text-placeholder':   '#64748b',
  '--helix-textarea-text-disabled':      '#475569',
  '--helix-textarea-text-label':         '#f1f5f9',
  '--helix-textarea-text-description':   '#94a3b8',
  '--helix-textarea-text-error':         '#fca5a5',
  '--helix-textarea-border-default':        '#334155',
  '--helix-textarea-border-hover':       '#475569',
  '--helix-textarea-border-focus':       '#60a5fa',
  '--helix-textarea-border-invalid':     '#f87171',
  '--helix-textarea-border-disabled':    '#334155',
  '--helix-checkbox-fill-default':          '#0f172a',
  '--helix-checkbox-fill-disabled':      '#0f172a',
  '--helix-checkbox-fill-checked':       '#2563eb',
  '--helix-checkbox-fill-checked-hover':  '#1d4ed8',
  '--helix-checkbox-border-default':        '#334155',
  '--helix-checkbox-border-hover':       '#475569',
  '--helix-checkbox-border-checked':     '#2563eb',
  '--helix-checkbox-border-focus':       '#60a5fa',
  '--helix-checkbox-border-disabled':    '#334155',
  '--helix-checkbox-border-invalid':     '#f87171',
  '--helix-checkbox-icon-color':         '#f1f5f9',
  '--helix-checkbox-text-label':         '#f1f5f9',
  '--helix-checkbox-text-description':   '#94a3b8',
  '--helix-checkbox-text-error':         '#fca5a5',
  '--helix-radio-fill-default':             '#0f172a',
  '--helix-radio-fill-disabled':         '#0f172a',
  '--helix-radio-fill-checked':          '#2563eb',
  '--helix-radio-fill-checked-hover':     '#1d4ed8',
  '--helix-radio-border-default':           '#334155',
  '--helix-radio-border-hover':          '#475569',
  '--helix-radio-border-checked':        '#2563eb',
  '--helix-radio-border-focus':          '#60a5fa',
  '--helix-radio-border-disabled':       '#334155',
  '--helix-radio-border-invalid':        '#f87171',
  '--helix-radio-dot':                   '#f1f5f9',
  '--helix-radio-text-label':            '#f1f5f9',
  '--helix-radio-text-description':      '#94a3b8',
  '--helix-radio-text-error':            '#fca5a5',
  '--helix-switch-track-fill-off':       '#1e293b',
  '--helix-switch-track-fill-on':        '#2563eb',
  '--helix-switch-track-fill-on-hover':  '#1d4ed8',
  '--helix-switch-track-fill-disabled':  '#0f172a',
  '--helix-switch-border-focus':         '#60a5fa',
  '--helix-switch-thumb-fill':           '#f1f5f9',
  '--helix-switch-text-label':           '#f1f5f9',
  '--helix-switch-text-description':     '#94a3b8',
  // Pill must stay lighter than its own track in dark mode too (same "raised chip on a recessed
  // groove" relationship as Switch's thumb-vs-track) — so this does NOT mirror each var's own base
  // semantic token's dark value 1:1 (both fill.page and fill.secondary-interactive-default would
  // otherwise resolve close together). Track uses the page-level dark tone (recessed); pill uses the
  // lighter "surface" dark tone Toast/Modal/SidePanel already use for raised content.
  '--helix-segmentedControl-fill-track':   '#0f172a',
  '--helix-segmentedControl-fill-pill':    '#1e293b',
  '--helix-segmentedControl-text-default': '#94a3b8',
  '--helix-segmentedControl-text-checked': '#f1f5f9',

  // semantic — colored "-light" tint fills (badges/chips/nav "current" highlight),
  // never overridden before now. Reuse steps already defined in each hue's own
  // primitive ramp rather than inventing new colors. Status hues (danger/success/
  // warning/info) use .800, one step lighter than .900, so the fill itself reads
  // as a visible tinted chip rather than near-black; the brand "primary" tint
  // (nav "current" highlight, avatar) stays at .900 since it isn't a status color.
  '--helix-color-fill-primary-interactive-light-default': '#1e3a8a',
  '--helix-color-fill-danger-interactive-light-default':  '#991b1b',
  '--helix-color-fill-success-light':                     '#166534',
  '--helix-color-fill-warning-light':                     '#92400e',
  '--helix-color-fill-info-light':                        '#075985',

  // semantic — status border on a colored "-light" tint background: a lighter,
  // more saturated step so the outline stays visible against the dark fill above.
  // `danger`/`success`/`warning`/`info` are now the OFFICIAL/base tone (moved from `-dark` — see
  // the naming correction: the base name belongs to the more commonly used tone, not whichever one
  // was named first); `-light` is the decorative-only exception (Badge). Same resolved dark-mode
  // values as before the rename in every case — only which var name maps to which value changed.
  '--helix-color-border-danger':  '#f87171',
  '--helix-color-border-danger-light': '#f87171',
  '--helix-color-border-success': '#4ade80',
  '--helix-color-border-success-light': '#4ade80',
  '--helix-color-border-warning': '#fbbf24',
  '--helix-color-border-warning-light': '#fbbf24',
  '--helix-color-border-info':    '#38bdf8',
  '--helix-color-border-info-light': '#38bdf8',

  // semantic — status text/icon on a colored "-light" tint background (badges, chips):
  // the same medium-saturation hex used in light mode reads low-contrast against the
  // dark tint fills above, so these get a lighter step of their own hue instead.
  '--helix-color-text-info':    '#7dd3fc',
  '--helix-color-text-success': '#86efac',
  '--helix-color-text-warning': '#fcd34d',
  '--helix-color-text-danger':  '#fecdd3',
  '--helix-color-icon-info':    '#7dd3fc',
  '--helix-color-icon-success': '#86efac',
  '--helix-color-icon-warning': '#fcd34d',
  '--helix-color-icon-danger':  '#fecdd3',

  '--helix-iconButton-fill-secondary-default': '#1e293b',
  '--helix-iconButton-fill-secondary-hover':   '#334155',
  '--helix-iconButton-fill-secondary-press':   '#475569',
  '--helix-iconButton-icon-primary':           '#0f172a',
  '--helix-iconButton-icon-secondary':         '#f1f5f9',
  '--helix-iconButton-icon-ghost':              '#f1f5f9',
  '--helix-iconButton-icon-danger':            '#0f172a',
  '--helix-iconButton-border-secondary-default': '#334155',
  '--helix-iconButton-border-secondary-hover': '#475569',
  '--helix-iconButton-border-focus':           '#60a5fa',

  // fab-fill/fab-icon (primary blue + white) intentionally have NO dark entry here — same brand-blue
  // pairing Button/IconButton's primary variant already uses unchanged in dark mode. fab-action mirrors
  // Card's white-surface flip since it's a small neutral surface sitting on the page, not a brand fill.
  '--helix-fab-action-fill': '#0f172a',
  '--helix-fab-action-icon': '#f1f5f9',
  '--helix-fab-action-border': '#334155',

  '--helix-avatarGroup-overflow-fill': '#1e293b',
  '--helix-avatarGroup-overflow-text': '#94a3b8',

  '--helix-badge-fill-neutral': '#1e293b',
  '--helix-badge-fill-info':    '#075985',
  '--helix-badge-fill-success': '#166534',
  '--helix-badge-fill-warning': '#92400e',
  '--helix-badge-fill-danger':  '#991b1b',
  '--helix-badge-text-neutral': '#94a3b8',
  '--helix-badge-text-info':    '#7dd3fc',
  '--helix-badge-text-success': '#86efac',
  '--helix-badge-text-warning': '#fcd34d',
  '--helix-badge-text-danger':  '#fecdd3',
  '--helix-badge-icon-neutral': '#94a3b8',
  '--helix-badge-icon-info':    '#7dd3fc',
  '--helix-badge-icon-success': '#86efac',
  '--helix-badge-icon-warning': '#fcd34d',
  '--helix-badge-icon-danger':  '#fecdd3', // must match --helix-badge-text-danger — every other variant keeps icon/text at one shared tone in dark mode
  '--helix-badge-border-neutral': '#334155',
  '--helix-badge-border-info':    '#38bdf8',
  '--helix-badge-border-success': '#4ade80',
  '--helix-badge-border-warning': '#fbbf24',
  '--helix-badge-border-danger':  '#f87171',

  '--helix-avatar-fill': '#1e3a8a',
  '--helix-avatar-text': '#60a5fa',

  '--helix-pageHeader-title-color':       '#f1f5f9',
  '--helix-pageHeader-description-color': '#94a3b8',

  '--helix-table-header-color':  '#64748b',
  '--helix-table-header-border': '#1e293b',
  '--helix-table-row-border':    '#1e293b',
  '--helix-table-row-hoverFill': '#1e293b',
  '--helix-table-cell-color':    '#f1f5f9',

  '--helix-navItem-fill-hover':    '#1e293b',
  '--helix-navItem-fill-current':  '#1e3a8a',
  '--helix-navItem-text-default':  '#94a3b8',
  '--helix-navItem-text-current':  '#60a5fa',
  '--helix-navItem-icon-default':  '#94a3b8',
  '--helix-navItem-icon-current':  '#60a5fa',

  '--helix-topBar-fill':   '#0f172a',
  '--helix-topBar-border': '#1e293b',

  '--helix-sideNav-fill':   '#0f172a',
  '--helix-sideNav-border': '#1e293b',

  // ─── Dark-mode completeness audit (2026-09-13) ───────────────────────────
  // This map only needs an entry per CSS var whose dark value actually DIFFERS from
  // light — that's the whole point of a diff-style override map, not a gap by itself.
  // But a pass comparing every light color/shadow var against this map turned up real
  // omissions: tokens that were clearly *meant* to follow an already-established dark
  // convention elsewhere in this same file, just never got their own entry (the build
  // inlines resolved values per CSS var rather than chaining var(), so an alias can't
  // "inherit" its source token's override automatically — see the CSS pipeline caveat
  // in packages/tokens/CLAUDE.md). Two real families fixed here:
  //
  // 1) Focus-ring color: Select/Textarea/Checkbox/Radio/Switch/IconButton's own
  //    `border-focus` were already using #60a5fa (a lighter blue that reads better on
  //    a dark surface than the light-mode #3b82f6) — but the base semantic token and
  //    Button/Input/FAB's own `border-focus` were left un-overridden, silently keeping
  //    the light-mode blue in dark mode. Same fix, applied everywhere the others already were.
  '--helix-color-border-focus':  '#60a5fa',
  '--helix-button-border-focus': '#60a5fa',
  '--helix-input-border-focus':  '#60a5fa',
  '--helix-fab-border-focus':    '#60a5fa',
  // Focus glow (Input's outer ring) — same treatment: the accent color moves to the
  // dark-mode focus blue, opacity nudged up slightly so it's still visible on a dark fill.
  '--helix-input-shadow-focus':  '0 0 0 3px rgba(96,165,250,0.35)',
  '--helix-shadow-focus':        '0 0 0 3px rgba(96,165,250,0.35)',
  //
  // 2) Pale-tint interactive hover: `fill.primary-interactive-light-default` and
  //    `fill.danger-interactive-light-default` already had dark values below (#1e3a8a,
  //    #991b1b — one step down each primitive scale) — their `-hover` siblings didn't,
  //    so hovering one of these light-tint surfaces in dark mode silently fell back to
  //    the light-mode pale tint (near-invisible against a dark page). Hover now steps
  //    one primitive rung lighter than its own default, matching how every other
  //    default→hover pair in this file gets lighter on hover in dark mode.
  '--helix-color-fill-primary-interactive-light-hover': '#1e40af',
  '--helix-color-fill-danger-interactive-light-hover':  '#b91c1c',
  //
  // 3) Shadows had ZERO dark treatment anywhere in the file — every floating surface
  //    (Menu, Modal, SidePanel, Toast, Tooltip, FAB) was reusing light-mode's very low
  //    alpha (0.04–0.1) black shadow, which reads as almost no shadow at all against a
  //    near-black page. Opacity roughly tripled so elevation stays visible; hue/offsets
  //    unchanged since only visibility, not direction, needed to change.
  '--helix-shadow-xs': '0 1px 2px rgba(0,0,0,0.3)',
  '--helix-shadow-s':  '0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)',
  '--helix-shadow-m':  '0 4px 6px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)',
  '--helix-shadow-l':  '0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.25)',
  '--helix-shadow-xl': '0 20px 25px rgba(0,0,0,0.45), 0 10px 10px rgba(0,0,0,0.25)',
  '--helix-menu-shadow':             '0 4px 6px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)',
  '--helix-fab-shadow':              '0 4px 6px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)',
  '--helix-fab-action-shadow':       '0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)',
  '--helix-tooltip-shadow':          '0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)',
  '--helix-modal-shadow':            '0 20px 25px rgba(0,0,0,0.45), 0 10px 10px rgba(0,0,0,0.25)',
  '--helix-sidePanel-shadow':        '0 20px 25px rgba(0,0,0,0.45), 0 10px 10px rgba(0,0,0,0.25)',
  '--helix-sidePanel-shadowBottom':  '0 -20px 25px rgba(0,0,0,0.45), 0 -10px 10px rgba(0,0,0,0.25)',
  '--helix-toast-shadow':            '0 20px 25px rgba(0,0,0,0.45), 0 10px 10px rgba(0,0,0,0.25)',
  //
  // 4) Textarea's character counter aliases semantic.color.text.neutral-lightest, which
  //    already has its own dark entry above (#64748b, deliberately the SAME hex in both
  //    themes — gray-500 already reads fine on both a white and a near-black page) — the
  //    counter just never got its own copy of that same value.
  '--helix-textarea-text-counter': '#64748b',
  //
  // NOT changed, on purpose: the saturated brand fills (`*-interactive-default/hover/press`
  // for primary/danger/success/warning/info, and every Button/IconButton/FAB variant built
  // on them) plus their white text/icon. These intentionally stay the identical hex in both
  // themes — a solid brand-colored button is meant to look the same regardless of page
  // theme, and since the pixels don't change, their already-verified light-mode contrast
  // (white text/icon on the solid fill) carries over unchanged rather than needing a
  // separate dark check. Not a coverage gap — a deliberate, common dark-mode convention.
};

// ─── Responsive typography (mobile fontSize override) ─────────────────────────
//
// primitive.fontSize.* is the desktop/tablet size (unchanged, no media query needed since
// primitive.breakpoint.tablet === primitive.breakpoint.desktop for typography). Below the
// tablet breakpoint, override with semantic.fontSize.mobile.* (87.5% of desktop, see ADR).
//
// CAVEAT: this overrides --helix-primitive-fontSize-* only. semantic/component fontSize vars
// (e.g. --helix-button-fontSize-m) currently INLINE their resolved value at build time rather
// than referencing var(--helix-primitive-fontSize-*), so this override does not cascade to
// them yet — it only affects consumers that reference the primitive var directly. Making it
// cascade everywhere requires switching alias resolution from inlining to var() chaining,
// a larger pipeline change tracked separately.

const tabletBreakpointPx = Number(
  resolveRef('{primitive.breakpoint.tablet}', tokens).replace('px', ''),
);
const mobileMaxWidthPx = tabletBreakpointPx - 1;

const mobileFontSizeVars = flatten(
  (tokens['semantic'] as Tree)['fontSize'] as Tree,
  tokens,
  ['fontSize'],
  'semantic',
).filter(v => v.name.startsWith('--helix-fontSize-mobile-'));

const mobileFontSizeOverrides = mobileFontSizeVars.map(v => {
  const primitiveName = v.name.replace('--helix-fontSize-mobile-', '--helix-primitive-fontSize-');
  return { name: primitiveName, value: v.value };
});

// ─── Write CSS ────────────────────────────────────────────────────────────────

const sections = {
  primitive: primitiveVars.map(v => `  ${v.name}: ${v.value};`).join('\n'),
  semantic:  semanticVars.map(v => `  ${v.name}: ${v.value};${v.description ? ` /* ${v.description} */` : ''}`).join('\n'),
  component: componentVars.map(v => `  ${v.name}: ${v.value};`).join('\n'),
  dark2:     Object.entries(darkOverrides).map(([k, v]) => `  ${k}: ${v};`).join('\n'),
  dark4:     Object.entries(darkOverrides).map(([k, v]) => `    ${k}: ${v};`).join('\n'),
  mobileFontSize: mobileFontSizeOverrides.map(v => `    ${v.name}: ${v.value};`).join('\n'),
};

const css = `/* ============================================================
   Helix DS — Generated design tokens
   Source: packages/tokens/src/tokens.json
   DO NOT EDIT — run pnpm --filter @helix-ds/tokens build
   ============================================================ */

/* ── Primitive tokens (raw scale) ───────────────────────────── */
:root {
${sections.primitive}
}

/* ── Semantic tokens (role aliases) ─────────────────────────── */
:root {
${sections.semantic}
}

/* ── Component tokens (component-specific) ──────────────────── */
:root {
${sections.component}
}

/* ── Dark mode overrides ─────────────────────────────────────── */
/* Explicit toggle wins first */
:root[data-theme="dark"] {
${sections.dark2}
}

/* OS preference (only when no explicit light override) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${sections.dark4}
  }
}

/* ── Responsive typography — mobile fontSize override ────────── */
/* Below primitive.breakpoint.tablet (${tabletBreakpointPx}px); tablet+desktop share the base size above,
   so one query covers both. See semantic.fontSize.mobile.* for the source values. */
@media (max-width: ${mobileMaxWidthPx}px) {
  :root {
${sections.mobileFontSize}
  }
}
`;

fs.writeFileSync(path.join(dist, 'helix.css'), css);

// ─── Write TypeScript constants ───────────────────────────────────────────────

function buildTs(obj: Tree, root: Tree, indent = 1): string[] {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const node = val as Tree;
    // A key needs quoting if it has any non-identifier character, OR starts with a digit — the
    // original check only tested the first case, which let `2xl`/`100` (spacing/size/fontSize scale
    // keys — all valid characters, just an invalid identifier START) through unquoted, producing
    // syntactically invalid object literals (`2xl: '32px'`) in dist/index.ts.
    const safeKey = /[^a-zA-Z0-9_$]/.test(key) || /^[0-9]/.test(key) ? `'${key}'` : key;
    if ('$value' in node) {
      const token = node as unknown as TokenNode;
      if (isComposite(token.$value)) {
        lines.push(`${pad}${safeKey}: {`);
        for (const [subKey, subVal] of Object.entries(token.$value)) {
          lines.push(`${pad}  ${subKey}: '${resolveRef(subVal, root)}',`);
        }
        lines.push(`${pad}},`);
      } else {
        const value = typeof token.$value === 'string'
          ? resolveRef(token.$value, root)
          : String(token.$value);
        lines.push(`${pad}${safeKey}: '${value}',`);
      }
    } else {
      lines.push(`${pad}${safeKey}: {`);
      lines.push(...buildTs(node, root, indent + 1));
      lines.push(`${pad}},`);
    }
  }
  return lines;
}

const ts = [
  '// Helix DS — generated token constants',
  '// DO NOT EDIT — run pnpm --filter @helix-ds/tokens build',
  '',
  '/** Raw token values, typed as const. Use CSS vars at runtime instead. */',
  'export const tokens = {',
  '  primitive: {',
  ...buildTs(tokens['primitive'] as Tree, tokens, 2),
  '  },',
  '  semantic: {',
  ...buildTs(tokens['semantic'] as Tree, tokens, 2),
  '  },',
  '  component: {',
  ...buildTs(tokens['component'] as Tree, tokens, 2),
  '  },',
  '} as const;',
  '',
  'export type Tokens = typeof tokens;',
  '',
  '/** CSS variable names for all tokens (for use with getComputedStyle) */',
  'export const cssVars = {',
  ...allVars.map(v => {
    const key = v.name.replace('--helix-', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return `  '${key}': '${v.name}',`;
  }),
  '} as const;',
].join('\n');

fs.writeFileSync(path.join(dist, 'index.ts'), ts);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('✅ Helix tokens built');
console.log(`   Primitive: ${primitiveVars.length} vars`);
console.log(`   Semantic:  ${semanticVars.length} vars`);
console.log(`   Component: ${componentVars.length} vars`);
console.log(`   Total:     ${allVars.length} CSS custom properties`);
console.log(`   Dark mode: ${Object.keys(darkOverrides).length} overrides`);
