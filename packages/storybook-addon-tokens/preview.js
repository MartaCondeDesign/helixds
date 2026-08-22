import { addons } from '@storybook/preview-api';
import { HELIX_HIGHLIGHT_EVENT } from './constants.js';

const HIGHLIGHT_CLASS = 'helix-token-highlight';
const STYLE_ID = 'helix-token-highlight-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 2px solid var(--helix-color-border-focus, #2563eb) !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--helix-color-border-focus, #2563eb) 20%, transparent) !important;
      transition: outline-color 120ms ease, box-shadow 120ms ease;
    }
  `;
  document.head.appendChild(style);
}

function clearHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el => el.classList.remove(HIGHLIGHT_CLASS));
}

function applyHighlight(part, variant) {
  clearHighlights();
  if (!part) return;
  const root = document.getElementById('storybook-root') || document.body;
  const scoped = variant ? root.querySelectorAll(`[data-helix-part="${part}"][data-variant="${variant}"]`) : [];
  const matches = scoped.length ? scoped : root.querySelectorAll(`[data-helix-part="${part}"]`);
  matches.forEach(el => el.classList.add(HIGHLIGHT_CLASS));
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  ensureStyle();
  addons.getChannel().on(HELIX_HIGHLIGHT_EVENT, payload => {
    if (!payload) {
      clearHighlights();
    } else {
      applyHighlight(payload.part, payload.variant);
    }
  });
}
