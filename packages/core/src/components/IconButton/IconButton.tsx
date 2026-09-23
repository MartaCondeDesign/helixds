import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { PRESS_SCALE_COMPACT } from '../../lib/motionPresets';
import { Icon } from '../Icon';
import type { IconButtonProps } from './IconButton.types';

const ICON_SIZE_BY_BUTTON_SIZE = { s: 16, m: 18, l: 20 } as const;

const Spinner = () => (
  <svg
    data-helix-part="icon-button-spinner"
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

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = 'ghost',
      size    = 'm',
      loading = false,
      className,
      disabled,
      onPress,
      // Not forwarded to motion.button — same reason as Button (ADR-007): Motion's HTMLMotionProps
      // redefines these native names for its own gesture/animation system.
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
    const isDisabled = disabled || loading;

    // `scale` (in whileTap below) is Motion's own animation-target key — a verify:props false positive,
    // same category as Button.tsx's whileTap.
    return (
      <motion.button
        ref={ref}
        data-helix-part="icon-button"
        data-variant={variant}
        data-size={size}
        data-loading={loading ? 'true' : undefined}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        aria-label={label}
        className={cn(className)}
        onClick={onPress}
        transition={{ duration: 0.1 }}
        {...(isDisabled ? {} : { whileTap: { scale: PRESS_SCALE_COMPACT } })}
        {...props}
      >
        {loading ? <Spinner /> : <Icon icon={icon} size={ICON_SIZE_BY_BUTTON_SIZE[size]} />}
      </motion.button>
    );
  },
);

IconButton.displayName = 'IconButton';

export { IconButton };
