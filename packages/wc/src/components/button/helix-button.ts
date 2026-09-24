import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type HelixButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type HelixButtonSize = 's' | 'm' | 'l';

/**
 * `<helix-button>` — pilot Web Components equivalent of `@helix-ds/core`'s `Button` (ADR-015).
 * CSS ported from `globals.css`'s `[data-helix-part="button"]` block into `static styles`.
 *
 * The React version's press-scale feedback comes from the `motion` library (ADR-007), a React-only
 * dependency — here it's a plain CSS `:active` transition instead. Visually close, not physics-
 * identical to Motion's spring; that's a deliberate, documented substitution, not a bug.
 *
 * A native `click` on the internal shadow `<button>` is a composed UIEvent, so it bubbles through the
 * shadow boundary as-is — `helixButtonEl.addEventListener('click', ...)` works with no extra plumbing,
 * no custom `helix-press` event needed.
 *
 * @example
 * <helix-button variant="primary" size="m">Save</helix-button>
 * <helix-button variant="secondary" loading>Saving…</helix-button>
 */
@customElement('helix-button')
export class HelixButton extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--helix-primitive-spacing-50);
      font-family: inherit;
      border-radius: var(--helix-button-radius);
      border: var(--helix-borderWidth-thin) solid transparent;
      cursor: pointer;
      transition:
        background-color var(--helix-primitive-duration-base) var(--helix-primitive-easing-base),
        border-color var(--helix-primitive-duration-base) var(--helix-primitive-easing-base),
        color var(--helix-primitive-duration-base) var(--helix-primitive-easing-base),
        box-shadow var(--helix-primitive-duration-base) var(--helix-primitive-easing-base),
        transform 0.1s var(--helix-primitive-easing-base);
      white-space: nowrap;
      user-select: none;
      outline: none;
      width: 100%;
      -webkit-appearance: none;
    }
    button:active:not(:disabled) {
      transform: scale(0.97);
    }
    :host([size='s']) button { height: var(--helix-button-height-s); padding: 0 var(--helix-button-padding-x-s); font-size: var(--helix-button-fontSize-s); font-weight: var(--helix-button-fontWeight-s); }
    :host([size='m']) button { height: var(--helix-button-height-m); padding: 0 var(--helix-button-padding-x-m); font-size: var(--helix-button-fontSize-m); font-weight: var(--helix-button-fontWeight-m); }
    :host([size='l']) button { height: var(--helix-button-height-l); padding: 0 var(--helix-button-padding-x-l); font-size: var(--helix-button-fontSize-l); font-weight: var(--helix-button-fontWeight-l); }

    :host([variant='primary']) button { background-color: var(--helix-button-fill-primary-default); color: var(--helix-button-text-primary); border-color: var(--helix-button-fill-primary-default); }
    :host([variant='primary']) button:hover:not(:disabled) { background-color: var(--helix-button-fill-primary-hover); border-color: var(--helix-button-fill-primary-hover); }
    :host([variant='primary']) button:active:not(:disabled) { background-color: var(--helix-button-fill-primary-press); border-color: var(--helix-button-fill-primary-press); }

    :host([variant='secondary']) button { background-color: var(--helix-button-fill-secondary-default); color: var(--helix-button-text-secondary); border-color: var(--helix-button-border-secondary-default); }
    :host([variant='secondary']) button:hover:not(:disabled) { background-color: var(--helix-button-fill-secondary-hover); border-color: var(--helix-button-border-secondary-hover); }
    :host([variant='secondary']) button:active:not(:disabled) { background-color: var(--helix-button-fill-secondary-press); }

    :host([variant='ghost']) button { background-color: transparent; color: var(--helix-button-text-ghost); border-color: transparent; }
    :host([variant='ghost']) button:hover:not(:disabled) { background-color: var(--helix-button-fill-secondary-default); }
    :host([variant='ghost']) button:active:not(:disabled) { background-color: var(--helix-button-fill-secondary-hover); }

    :host([variant='danger']) button { background-color: var(--helix-button-fill-danger-default); color: var(--helix-button-text-danger); border-color: var(--helix-button-fill-danger-default); }
    :host([variant='danger']) button:hover:not(:disabled) { background-color: var(--helix-button-fill-danger-hover); border-color: var(--helix-button-fill-danger-hover); }
    :host([variant='danger']) button:active:not(:disabled) { background-color: var(--helix-button-fill-danger-press); border-color: var(--helix-button-fill-danger-press); }

    button:disabled { background-color: var(--helix-button-fill-disabled); color: var(--helix-button-text-disabled); border-color: var(--helix-button-border-disabled); cursor: not-allowed; }
    button:focus-visible { outline: 2px solid var(--helix-button-border-focus); outline-offset: 2px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--helix-button-border-focus) 20%, transparent); }
    :host([full-width]) { width: 100%; }
    :host([full-width]) button { width: 100%; }

    .spinner { animation: helix-spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes helix-spin { to { transform: rotate(360deg); } }

    ::slotted([slot='icon']), ::slotted([slot='icon-end']) { width: 16px; height: 16px; }
    slot[name='icon'][hidden], slot[name='icon-end'][hidden] { display: none; }
  `;

  @property({ type: String, reflect: true }) variant: HelixButtonVariant = 'primary';
  @property({ type: String, reflect: true }) size: HelixButtonSize = 'm';
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean, reflect: true, attribute: 'full-width' }) fullWidth = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    const isDisabled = this.disabled || this.loading;
    return html`
      <button part="root" type="button" ?disabled=${isDisabled} aria-busy=${this.loading ? 'true' : 'false'}>
        ${this.loading
          ? html`<svg class="spinner" part="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>`
          : html`<slot name="icon" part="icon"></slot>`}
        <slot part="label"></slot>
        ${!this.loading ? html`<slot name="icon-end" part="icon-end"></slot>` : null}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'helix-button': HelixButton;
  }
}
