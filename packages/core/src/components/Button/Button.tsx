import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { PRESS_SCALE_DEFAULT } from '../../lib/motionPresets';
import { resolveTokenPx } from '../../lib/resolveTokenPx';
import { Icon } from '../Icon';
import type { ButtonProps } from './Button.types';

/**
 * Swap-in-place (transitions.dev "icon swap" + "text morph"): when `value` changes (compared with ===:
 * an icon component, the string 'loading', a label string), the previous one is kept for
 * `durationToken` so the old and new can cross-fade in the same slot, then dropped. Decided during render
 * (not in an effect) so the old content never disappears for a frame first. Under reduced motion there is
 * nothing to cross-fade — it swaps straight away.
 */
function useSwap<T>(value: T, durationToken: string, ref: React.RefObject<HTMLElement | null>) {
  const [state, setState] = React.useState({ current: value, previous: null as T | null, turn: 0 });
  if (value !== state.current) {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setState({ current: value, previous: reduced ? null : state.current, turn: state.turn + 1 });
  }
  React.useEffect(() => {
    if (state.previous === null) return;
    const timer = window.setTimeout(() => setState(s => ({ ...s, previous: null })), resolveTokenPx(durationToken, ref.current));
    return () => window.clearTimeout(timer);
  }, [state.turn, state.previous, durationToken, ref]);
  return state;
}

const Spinner = () => (
  <svg
    data-helix-part="button-spinner"
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'm',
      isLoading   = false,
      icon,
      iconEnd,
      fullWidth = false,
      className,
      disabled,
      children,
      onClick,
      // Not forwarded to motion.button: Motion's HTMLMotionProps redefines these native names (style,
      // onDrag and its siblings) with incompatible signatures for its own gesture/animation system —
      // same reason FAB (ADR-007) doesn't spread them either. Everything else in ...props still passes
      // through untouched (type, form, name, title, data-*, aria-*, ...).
      style: _style,
      onDrag: _onDrag,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onAnimationIteration: _onAnimationIteration,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    // Icon slot: with an `icon`, the icon ↔ spinner (loading) and icon A ↔ icon B changes cross-fade in
    // place. Without one, the spinner still just appears, as before — there's no slot to swap within.
    const iconRef = React.useRef<HTMLSpanElement>(null);
    const iconSwap = useSwap(icon ? (isLoading ? ('loading' as const) : icon) : null, '--helix-button-swap-duration-icon', iconRef);
    const renderIcon = (value: NonNullable<typeof iconSwap.current>) => (value === 'loading' ? <Spinner /> : <Icon icon={value} size={16} />);

    // Label: a plain-text label that changes ("Copy link" → "Copied") cross-blurs in place while the
    // label's width eases to the new text's.
    const labelRef = React.useRef<HTMLSpanElement>(null);
    const labelText = typeof children === 'string' || typeof children === 'number' ? String(children) : null;
    const labelSwap = useSwap(labelText, '--helix-button-swap-duration-label', labelRef);
    const labelSwapping = labelSwap.previous !== null && labelText !== null;
    // The label's resting width, remembered between swaps (nothing to remember while one is easing).
    const labelWidth = React.useRef(0);
    const widthEasing = React.useRef(false);
    React.useLayoutEffect(() => {
      if (labelRef.current && !widthEasing.current) labelWidth.current = labelRef.current.getBoundingClientRect().width;
    });
    // Runs once per swap (keyed on its turn) — not on the swap ending, which comes sooner than the
    // width ease and must not cut it short.
    React.useLayoutEffect(() => {
      const el = labelRef.current;
      const incoming = el?.lastElementChild as HTMLElement | null | undefined;
      if (!el || !incoming || !labelSwapping) return;
      const padding = parseFloat(getComputedStyle(el).paddingLeft) + parseFloat(getComputedStyle(el).paddingRight);
      widthEasing.current = true;
      el.style.width = `${labelWidth.current}px`;
      void el.offsetWidth; // commit the starting width so the change to the new one transitions
      el.style.width = `${incoming.getBoundingClientRect().width + padding}px`;
      const done = () => { el.style.width = ''; widthEasing.current = false; };
      const timer = window.setTimeout(done, resolveTokenPx('--helix-button-swap-duration-width', el));
      return () => { window.clearTimeout(timer); done(); };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- once per swap: labelSwapping is read at that moment
    }, [labelSwap.turn]);

    return (
      <motion.button
        ref={ref}
        data-helix-part="button"
        data-variant={variant}
        data-size={size}
        data-loading={isLoading ? 'true' : undefined}
        data-full-width={fullWidth ? 'true' : undefined}
        disabled={isDisabled}
        aria-busy={isLoading ? 'true' : undefined}
        className={cn(className)}
        onClick={onClick}
        // Subtle press feedback — Motion, not CSS, so it composes with the loading/disabled states via
        // the same isDisabled check rather than fighting a :active pseudo-class. See ADR-007 /
        // .ai/maps/patterns/motion-effects.md.
        transition={{ duration: 0.1 }}
        {...(isDisabled ? {} : { whileTap: { scale: PRESS_SCALE_DEFAULT } })}
        {...props}
      >
        {iconSwap.current !== null ? (
          <span ref={iconRef} data-helix-part="button-icon" data-swapping={iconSwap.previous !== null ? 'true' : undefined}>
            {iconSwap.previous !== null && <React.Fragment key={`out-${iconSwap.turn}`}>{renderIcon(iconSwap.previous)}</React.Fragment>}
            <React.Fragment key={`in-${iconSwap.turn}`}>{renderIcon(iconSwap.current)}</React.Fragment>
          </span>
        ) : isLoading ? (
          <Spinner />
        ) : null}

        {children && (
          <span ref={labelRef} data-helix-part="button-label" data-swapping={labelSwapping ? 'true' : undefined}>
            {labelSwapping ? (
              <>
                <span key={`out-${labelSwap.turn}`} aria-hidden="true">{labelSwap.previous}</span>
                <span key={`in-${labelSwap.turn}`}>{children}</span>
              </>
            ) : children}
          </span>
        )}

        {!isLoading && iconEnd && (
          <span data-helix-part="button-icon-end">
            <Icon icon={iconEnd} size={16} />
          </span>
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
