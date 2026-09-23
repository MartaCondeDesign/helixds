import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type HelixBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type HelixBadgeSize = 'xs' | 's';

/**
 * `<helix-badge>` — pilot Web Components equivalent of `@helix-ds/core`'s `Badge` (ADR-015).
 * CSS ported from `packages/core/src/globals.css`'s `[data-helix-part="badge"]` block into this
 * component's own `static styles`, since Shadow DOM doesn't see that stylesheet. Token values
 * themselves need no porting — `--helix-*` custom properties inherit through the shadow boundary.
 *
 * @example
 * <helix-badge variant="success" label="Active"></helix-badge>
 * <helix-badge variant="warning" label="Pending"><svg slot="icon">...</svg></helix-badge>
 */
@customElement('helix-badge')
export class HelixBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      gap: var(--helix-primitive-spacing-25);
      border-radius: var(--helix-badge-radius);
      height: var(--helix-badge-height-s);
      font-family: var(--helix-badge-fontFamily);
      font-size: var(--helix-badge-fontSize);
      font-weight: var(--helix-badge-fontWeight);
      white-space: nowrap;
      line-height: var(--helix-badge-lineHeight);
      border: 1px solid transparent;
      padding: 3px 10px;
    }
    :host([size='xs']) {
      padding: 2px 6px;
      height: var(--helix-badge-height-xs);
    }
    :host([variant='neutral']) {
      background-color: var(--helix-badge-fill-neutral);
      color: var(--helix-badge-text-neutral);
      border-color: var(--helix-badge-border-neutral);
    }
    :host([variant='info']) {
      background-color: var(--helix-badge-fill-info);
      color: var(--helix-badge-text-info);
      border-color: var(--helix-badge-border-info);
    }
    :host([variant='success']) {
      background-color: var(--helix-badge-fill-success);
      color: var(--helix-badge-text-success);
      border-color: var(--helix-badge-border-success);
    }
    :host([variant='warning']) {
      background-color: var(--helix-badge-fill-warning);
      color: var(--helix-badge-text-warning);
      border-color: var(--helix-badge-border-warning);
    }
    :host([variant='danger']) {
      background-color: var(--helix-badge-fill-danger);
      color: var(--helix-badge-text-danger);
      border-color: var(--helix-badge-border-danger);
    }
    .icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    ::slotted([slot='icon']) {
      width: 12px;
      height: 12px;
      stroke: currentColor;
      fill: none;
    }
  `;

  @property({ type: String, reflect: true }) variant: HelixBadgeVariant = 'neutral';
  @property({ type: String, reflect: true }) size: HelixBadgeSize = 's';
  @property({ type: String }) label = '';

  render() {
    return html`
      <span class="icon" part="icon"><slot name="icon"></slot></span>
      <span part="label">${this.label}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'helix-badge': HelixBadge;
  }
}
