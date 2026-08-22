import { addons } from '@storybook/preview-api';
import { HELIX_HIGHLIGHT_EVENT, HELIX_HIGHLIGHT_COLOR, HELIX_HIGHLIGHT_COLOR_SOFT } from './constants.js';

const OUTLINE_CLASS = 'helix-token-highlight';
const RADIUS_CLASS = 'helix-token-highlight-radius';
const STYLE_ID = 'helix-token-highlight-style';
const OVERLAY_ID = 'helix-token-dimension-overlay';

// Cleanup functions for whatever the current hover applied — run before every new
// highlight and on clear, so nothing from a previous hover (or a previous story) lingers.
let cleanupFns = [];

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${OUTLINE_CLASS} {
      outline: 2px solid ${HELIX_HIGHLIGHT_COLOR} !important;
      outline-offset: 2px !important;
      transition: outline-color 120ms ease;
    }
    .${RADIUS_CLASS} {
      outline: 3px solid ${HELIX_HIGHLIGHT_COLOR} !important;
      outline-offset: -3px !important;
      transition: outline-color 120ms ease;
    }
  `;
  document.head.appendChild(style);
}

function clearAll() {
  cleanupFns.forEach(fn => {
    try { fn(); } catch { /* target may have unmounted with the story */ }
  });
  cleanupFns = [];
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) overlay.remove();
}

function findTargets(part, variant) {
  const root = document.getElementById('storybook-root') || document.body;
  const scoped = variant ? root.querySelectorAll(`[data-helix-part="${part}"][data-variant="${variant}"]`) : [];
  const list = scoped.length ? scoped : root.querySelectorAll(`[data-helix-part="${part}"]`);
  return Array.from(list);
}

// Typography rows point at a component's root part (e.g. "button"), but the text actually
// lives on a more specific descendant ("button-label"). Narrow to it via the same -label/
// -description/-error/... suffix convention every component's DOM already follows.
function refineTypographyTarget(root, item) {
  const text = `${item.label ?? ''} ${item.meta ?? ''}`.toLowerCase();
  const suffixes = ['label', 'description', 'error', 'placeholder', 'value', 'counter'];
  for (const suffix of suffixes) {
    if (text.includes(suffix)) {
      const el = root.querySelector(`[data-helix-part$="-${suffix}"]`);
      if (el) return el;
    }
  }
  return root;
}

function overrideInlineStyle(el, property, value, important) {
  const prevValue = el.style.getPropertyValue(property);
  const prevPriority = el.style.getPropertyPriority(property);
  el.style.setProperty(property, value, important ? 'important' : '');
  cleanupFns.push(() => {
    if (prevValue) el.style.setProperty(property, prevValue, prevPriority);
    else el.style.removeProperty(property);
  });
}

function addClass(el, className) {
  el.classList.add(className);
  cleanupFns.push(() => el.classList.remove(className));
}

function resolvePx(token, value) {
  if (token && typeof window !== 'undefined') {
    const resolved = window.getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (resolved) return resolved;
  }
  return value ?? '';
}

function drawDimensionLine(el, px, axis) {
  const rect = el.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483647';
  overlay.style.pointerEvents = 'none';

  const line = (style) => `position:fixed; background:${HELIX_HIGHLIGHT_COLOR}; ${style}`;
  const label = (left, top) => `
    position:fixed; left:${left}px; top:${top}px; transform:translateX(-50%);
    padding:2px 6px; font:600 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    color:#fff; background:${HELIX_HIGHLIGHT_COLOR}; border-radius:4px; white-space:nowrap;
  `;

  if (axis === 'vertical') {
    // Prefer the outside-right edge; fall back to outside-left, then to hugging the
    // element's own right edge (inside) if there's no room on either side.
    let left = rect.right + 14;
    if (left + 44 > window.innerWidth) left = rect.left - 44;
    let inside = false;
    if (left < 0) { left = rect.right - 14; inside = true; }
    const top = rect.top;
    // Sizing measures the component's own dimension — the line spans the component's
    // actual rendered height (not the token's raw px, which should already equal it).
    const height = rect.height;
    overlay.innerHTML = `
      <div style="${line(`left:${left}px; top:${top}px; width:2px; height:${height}px;`)}"></div>
      <div style="${line(`left:${left - 4}px; top:${top}px; width:10px; height:2px;`)}"></div>
      <div style="${line(`left:${left - 4}px; top:${top + height - 2}px; width:10px; height:2px;`)}"></div>
      <div style="${label(left + (inside ? -18 : 18), top + height / 2 - 9)}">${px}</div>
    `;
  } else {
    // Prefer outside-bottom; fall back to outside-top, then hugging the element's own
    // bottom edge (inside) if the viewport leaves no room either way.
    let top = rect.bottom + 14;
    if (top + 34 > window.innerHeight) top = rect.top - 34;
    let inside = false;
    if (top < 0) { top = rect.bottom - 20; inside = true; }
    const left = rect.left;
    // Spacing measures a gap, not the component itself — the line's length is the
    // token's own resolved px value, not the component's width (which would just be
    // drawing a second copy of the component's outline, not "how big is this gap").
    const width = parseFloat(px) || 0;
    overlay.innerHTML = `
      <div style="${line(`left:${left}px; top:${top}px; width:${width}px; height:2px;`)}"></div>
      <div style="${line(`left:${left}px; top:${top - 4}px; width:2px; height:10px;`)}"></div>
      <div style="${line(`left:${left + width - 2}px; top:${top - 4}px; width:2px; height:10px;`)}"></div>
      <div style="${label(left + width / 2, top + (inside ? -18 : 8))}">${px}</div>
    `;
  }

  document.body.appendChild(overlay);
}

function getAxis(item) {
  const text = `${item.part ?? ''}`.toLowerCase();
  return item.category === 'sizing' || text.includes('height') ? 'vertical' : 'horizontal';
}

function applyHighlight(payload) {
  clearAll();
  const { part, variant, category, token, value } = payload;
  if (!part) return;
  const targets = findTargets(part, variant);
  if (!targets.length) return;

  if (category === 'color') {
    targets.forEach(el => {
      if (token) overrideInlineStyle(el, token, HELIX_HIGHLIGHT_COLOR, false);
      else addClass(el, OUTLINE_CLASS);
    });
    return;
  }

  if (category === 'typography') {
    targets.forEach(el => {
      const target = refineTypographyTarget(el, payload);
      overrideInlineStyle(target, 'color', HELIX_HIGHLIGHT_COLOR, true);
    });
    return;
  }

  if (category === 'radius') {
    targets.forEach(el => addClass(el, RADIUS_CLASS));
    return;
  }

  if (category === 'shadows') {
    targets.forEach(el => {
      overrideInlineStyle(el, 'box-shadow', `0 8px 24px ${HELIX_HIGHLIGHT_COLOR_SOFT}, 0 2px 8px rgba(139, 92, 246, 0.55)`, true);
    });
    return;
  }

  if (category === 'spacing' || category === 'sizing') {
    const el = targets[0];
    addClass(el, OUTLINE_CLASS);
    const px = resolvePx(token, value);
    if (px) drawDimensionLine(el, px, getAxis(payload));
    return;
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  ensureStyle();
  addons.getChannel().on(HELIX_HIGHLIGHT_EVENT, payload => {
    if (!payload) clearAll();
    else applyHighlight(payload);
  });
}
