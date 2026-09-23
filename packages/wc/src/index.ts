/**
 * @helix-ds/wc — Web Components pilot (ADR-015). Registers the four piloted custom elements:
 * <helix-icon>, <helix-badge>, <helix-button>, <helix-tooltip>. Not a full port of @helix-ds/core.
 *
 * Consumers must load `@helix-ds/tokens/helix.css` on the page once — custom properties inherit
 * through Shadow DOM, so no per-component token wiring is needed.
 */
export { HelixIcon } from './components/icon/helix-icon';
export { HelixBadge } from './components/badge/helix-badge';
export type { HelixBadgeVariant, HelixBadgeSize } from './components/badge/helix-badge';
export { HelixButton } from './components/button/helix-button';
export type { HelixButtonVariant, HelixButtonSize } from './components/button/helix-button';
export { HelixTooltip } from './components/tooltip/helix-tooltip';
export type { HelixTooltipPlacement } from './components/tooltip/helix-tooltip';
