import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Copy of @helix/react's ICON_STROKE_PX_BY_SIZE (ADR-017) — this package can't import core.
// Real on-screen line width in px per icon size; keep in sync when that table changes.
const STROKE_PX_BY_SIZE: Record<number, number> = {
  12: 1.3, 14: 1.4, 16: 1.5, 18: 1.6, 20: 1.7, 24: 1.8, 28: 2.0, 32: 2.2, 36: 2.4, 40: 2.8,
};

/** SVG stroke (24×24 viewBox units) for `size`, per ADR-017. Off-scale sizes hold 16px's weight. */
const strokeForSize = (size: number) => ((STROKE_PX_BY_SIZE[size] ?? 1.5) * 24) / size;

/**
 * `<helix-icon>` — pilot Web Components equivalent of `@helix/react`'s `Icon` (ADR-015).
 *
 * Interop is deliberately different from the React version's `HelixIconComponent`/`createIconAdapter`
 * (ADR-014): a Custom Element has no way to receive a live component reference as an attribute, so
 * this wraps a default `<slot>` instead — the consumer places their own inline `<svg>` (Tabler or any
 * other set) as light-DOM content, and this element only applies size/color and the decorative/labeled
 * accessibility split.
 *
 * @example
 * <helix-icon size="16"><svg viewBox="0 0 24 24">...</svg></helix-icon>
 * <helix-icon size="24" decorative="false" label="Delete"><svg>...</svg></helix-icon>
 */
@customElement('helix-icon')
export class HelixIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--helix-icon-color, currentColor);
    }
    ::slotted(svg) {
      width: var(--helix-icon-size, 16px);
      height: var(--helix-icon-size, 16px);
      stroke: currentColor;
      stroke-width: var(--helix-icon-stroke, 2.25);
      fill: none;
    }
  `;

  /** Rendered icon size in pixels. Default: 16 — same fixed scale as the React Icon (12–40). */
  @property({ type: Number }) size = 16;

  /** Accessible label for icon-only usage. Required when `decorative` is false. */
  @property({ type: String }) label?: string;

  /** Marks the icon as decorative when a visible label already exists nearby. Default: true */
  @property({ type: Boolean }) decorative = true;

  connectedCallback() {
    super.connectedCallback();
    this.applySize();
  }

  private applySize() {
    this.style.setProperty('--helix-icon-size', `${this.size}px`);
    this.style.setProperty('--helix-icon-stroke', String(strokeForSize(this.size)));
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('size')) this.applySize();
    // Reflected onto the host, not just inside the shadow root — a screen reader inspects the host
    // element's own attributes, not shadow-internal markup (same reasoning as helix-tooltip's
    // aria-describedby placement below).
    const isMeaningful = !this.decorative && !!this.label;
    if (isMeaningful) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label!);
      this.removeAttribute('aria-hidden');
    } else {
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'helix-icon': HelixIcon;
  }
}
