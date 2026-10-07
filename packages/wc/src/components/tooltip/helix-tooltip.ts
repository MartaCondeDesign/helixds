import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type HelixTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const EDGE_GUTTER = 8;
let idCounter = 0;

/**
 * `<helix-tooltip>` — pilot Web Components equivalent of `@helixds/react`'s `Tooltip` (ADR-008/009,
 * ported per ADR-015). The hardest of the four piloted components: no native HTML equivalent, and a
 * real Shadow DOM accessibility problem to solve, not just a styling port.
 *
 * **Why the content node lives in light DOM, not inside the shadow root:** `aria-describedby` is an ID
 * reference. A light-DOM element's ID reference into a *different* element's shadow tree does not
 * reliably resolve across browsers today. So this component creates its tooltip-content `<span>` as a
 * real light-DOM child of the host (`this.appendChild(...)`, same tree as the slotted trigger), gives
 * it an id, and points the trigger's `aria-describedby` at that id — both elements now share one DOM
 * tree, so the reference just works. The content is then *projected back into* the shadow root via a
 * named slot purely so `static styles` can position it; that round-trip is what makes both the
 * accessibility wiring and the CSS positioning work at the same time.
 *
 * @example
 * <helix-tooltip label="Delete">
 *   <button>...</button>
 * </helix-tooltip>
 */
@customElement('helix-tooltip')
export class HelixTooltip extends LitElement {
  static styles = css`
    :host {
      position: relative;
      display: inline-flex;
    }
    ::slotted([slot='content']) {
      position: absolute;
      z-index: var(--helix-primitive-zIndex-tooltip, 1000);
      width: max-content;
      max-width: 240px;
      background-color: var(--helix-tooltip-fill);
      color: var(--helix-tooltip-text);
      border-radius: var(--helix-tooltip-radius);
      box-shadow: var(--helix-tooltip-shadow);
      padding: var(--helix-tooltip-padding-y) var(--helix-tooltip-padding-x);
      font-size: var(--helix-tooltip-fontSize);
      font-weight: var(--helix-tooltip-fontWeight);
      line-height: 1.4;
      white-space: pre-line;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--helix-tooltip-duration-out) var(--helix-easing-in),
        transform var(--helix-tooltip-duration-out) var(--helix-easing-in),
        visibility 0s linear var(--helix-tooltip-duration-out);
    }
    :host(:hover) ::slotted([slot='content']),
    :host(:focus-within) ::slotted([slot='content']) {
      opacity: 1;
      visibility: visible;
      transition-duration: var(--helix-tooltip-duration-in);
      transition-timing-function: var(--helix-easing-out);
      transition-delay: var(--helix-tooltip-delay);
    }
    :host([expanded='true']) ::slotted([slot='content']) {
      opacity: 1;
      visibility: visible;
      transition-delay: 0s;
    }
    :host([expanded='false']) ::slotted([slot='content']) {
      opacity: 0 !important;
      visibility: hidden !important;
    }
    :host([data-placement='top']) ::slotted([slot='content']) {
      bottom: calc(100% + var(--helix-tooltip-offset));
      left: 50%;
      transform-origin: 50% 100%;
      transform: translateX(calc(-50% + var(--tooltip-shift, 0px))) scale(var(--helix-tooltip-scale-enter));
    }
    :host([data-placement='bottom']) ::slotted([slot='content']) {
      top: calc(100% + var(--helix-tooltip-offset));
      left: 50%;
      transform-origin: 50% 0%;
      transform: translateX(calc(-50% + var(--tooltip-shift, 0px))) scale(var(--helix-tooltip-scale-enter));
    }
    :host([data-placement='left']) ::slotted([slot='content']) {
      right: calc(100% + var(--helix-tooltip-offset));
      top: 50%;
      transform-origin: 100% 50%;
      transform: translateY(calc(-50% + var(--tooltip-shift, 0px))) scale(var(--helix-tooltip-scale-enter));
    }
    :host([data-placement='right']) ::slotted([slot='content']) {
      left: calc(100% + var(--helix-tooltip-offset));
      top: 50%;
      transform-origin: 0% 50%;
      transform: translateY(calc(-50% + var(--tooltip-shift, 0px))) scale(var(--helix-tooltip-scale-enter));
    }
    :host([data-placement='top']:hover) ::slotted([slot='content']),
    :host([data-placement='top']:focus-within) ::slotted([slot='content']),
    :host([data-placement='top'][expanded='true']) ::slotted([slot='content']),
    :host([data-placement='bottom']:hover) ::slotted([slot='content']),
    :host([data-placement='bottom']:focus-within) ::slotted([slot='content']),
    :host([data-placement='bottom'][expanded='true']) ::slotted([slot='content']) {
      transform: translateX(calc(-50% + var(--tooltip-shift, 0px))) scale(1);
    }
    :host([data-placement='left']:hover) ::slotted([slot='content']),
    :host([data-placement='left']:focus-within) ::slotted([slot='content']),
    :host([data-placement='left'][expanded='true']) ::slotted([slot='content']),
    :host([data-placement='right']:hover) ::slotted([slot='content']),
    :host([data-placement='right']:focus-within) ::slotted([slot='content']),
    :host([data-placement='right'][expanded='true']) ::slotted([slot='content']) {
      transform: translateY(calc(-50% + var(--tooltip-shift, 0px))) scale(1);
    }
  `;

  @property({ type: String }) label = '';
  @property({ type: String }) placement: HelixTooltipPlacement = 'top';
  /** 'true'/'false' forces visibility regardless of hover/focus; unset = normal hover/focus-driven. */
  @property({ type: String, reflect: true }) expanded?: 'true' | 'false';

  private contentEl!: HTMLSpanElement;
  private uid = `helix-tooltip-${++idCounter}`;
  private recalculate = () => this._recalculate();

  connectedCallback() {
    super.connectedCallback();
    this.contentEl = document.createElement('span');
    this.contentEl.id = this.uid;
    this.contentEl.slot = 'content';
    this.contentEl.setAttribute('role', 'tooltip');
    this.contentEl.textContent = this.label;
    this.appendChild(this.contentEl);
    this.setAttribute('data-placement', this.placement);

    window.addEventListener('resize', this.recalculate);
    window.addEventListener('scroll', this.recalculate, true);
    this.addEventListener('keydown', this.handleKeyDown);
    // Measured after the first paint so getBoundingClientRect reflects real layout.
    requestAnimationFrame(this.recalculate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.recalculate);
    window.removeEventListener('scroll', this.recalculate, true);
    this.removeEventListener('keydown', this.handleKeyDown);
  }

  // WCAG 1.4.13 — dismissible on Escape while the trigger holds focus (blurring drops
  // :focus-within, which is what actually hides the content; this only handles the keypress).
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('label') && this.contentEl) this.contentEl.textContent = this.label;
    if (changed.has('placement')) this.recalculate();
  }

  private handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;
    trigger?.setAttribute('aria-describedby', this.uid);
  }

  // Flip + cross-axis clamp — direct port of Tooltip.tsx's useAutoPlacement (ADR-009).
  private _recalculate() {
    const trigger = this.querySelector(':scope > :not([slot])') as HTMLElement | null;
    if (!trigger || !this.contentEl) return;

    const rootRect = trigger.getBoundingClientRect();
    const contentRect = this.contentEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const requested = this.placement;
    let next: HelixTooltipPlacement = requested;

    if (requested === 'top' || requested === 'bottom') {
      const fitsTop = rootRect.top - contentRect.height - EDGE_GUTTER >= 0;
      const fitsBottom = rootRect.bottom + contentRect.height + EDGE_GUTTER <= vh;
      if (requested === 'top' && !fitsTop && fitsBottom) next = 'bottom';
      if (requested === 'bottom' && !fitsBottom && fitsTop) next = 'top';
    } else {
      const fitsLeft = rootRect.left - contentRect.width - EDGE_GUTTER >= 0;
      const fitsRight = rootRect.right + contentRect.width + EDGE_GUTTER <= vw;
      if (requested === 'left' && !fitsLeft && fitsRight) next = 'right';
      if (requested === 'right' && !fitsRight && fitsLeft) next = 'left';
    }

    let shift = 0;
    if (next === 'top' || next === 'bottom') {
      const center = rootRect.left + rootRect.width / 2;
      const half = contentRect.width / 2;
      const clamped = Math.min(Math.max(center, half + EDGE_GUTTER), vw - half - EDGE_GUTTER);
      shift = clamped - center;
    } else {
      const center = rootRect.top + rootRect.height / 2;
      const half = contentRect.height / 2;
      const clamped = Math.min(Math.max(center, half + EDGE_GUTTER), vh - half - EDGE_GUTTER);
      shift = clamped - center;
    }

    this.setAttribute('data-placement', next);
    this.contentEl.style.setProperty('--tooltip-shift', `${shift}px`);
  }

  render() {
    return html`
      <slot @slotchange=${this.handleSlotChange}></slot>
      <slot name="content"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'helix-tooltip': HelixTooltip;
  }
}
