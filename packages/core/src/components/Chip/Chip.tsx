import * as React from 'react';
import { motion, MotionConfig } from 'motion/react';
import { IconX } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { ChipProps } from './Chip.types';

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant = 'neutral',
      size = 's',
      disabled = false,
      label,
      icon,
      iconEnd,
      className,
      onPress,
      dismissible = false,
      onDismiss,
      ...props
    },
    ref,
  ) => {
    const isDismissible = dismissible && !!onDismiss;
    // Chip doesn't own its own presence — the consumer's list state does, via onDismiss. So the exit
    // animation is played HERE first (isDismissing), and the real onDismiss() only fires once it
    // finishes (onAnimationComplete) — the consumer removes it from their array right as it's already
    // fully faded out, not before, so there's no visual jump when the list actually reflows.
    const [isDismissing, setIsDismissing] = React.useState(false);

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = e => {
      onPress?.(e);
    };

    // `scale` (in animate below) is Motion's own animation-target key — a verify:props false positive,
    // same category as Button.tsx's whileTap.
    // MotionConfig scoped locally — Motion doesn't honor prefers-reduced-motion on its own (ADR-007).
    return (
      <MotionConfig reducedMotion="user">
      <motion.span
        data-helix-part="chip-shell"
        data-variant={variant}
        data-size={size}
        data-disabled={disabled ? 'true' : undefined}
        data-dismissible={isDismissible ? 'true' : undefined}
        className={cn(className)}
        animate={isDismissing ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onAnimationComplete={() => {
          if (isDismissing) onDismiss?.();
        }}
      >
        <button
          ref={ref}
          type="button"
          data-helix-part="chip"
          data-dismissible={isDismissible ? 'true' : undefined}
          data-variant={variant}
          data-size={size}
          data-disabled={disabled ? 'true' : undefined}
          disabled={disabled}
          onClick={handleClick}
          {...props}
        >
          {icon && (
            <span data-helix-part="chip-icon">
              <Icon icon={icon} size={14} />
            </span>
          )}

          <span data-helix-part="chip-label">{label}</span>

          {iconEnd && (
            <span data-helix-part="chip-icon-end">
              <Icon icon={iconEnd} size={14} />
            </span>
          )}
        </button>

        {isDismissible && (
          <button
            type="button"
            data-helix-part="chip-dismiss"
            aria-label={`Dismiss ${label}`}
            disabled={disabled}
            onClick={e => {
              e.stopPropagation();
              setIsDismissing(true);
            }}
          >
            <Icon icon={IconX} size={12} />
          </button>
        )}
      </motion.span>
      </MotionConfig>
    );
  },
);

Chip.displayName = 'Chip';

export { Chip };
