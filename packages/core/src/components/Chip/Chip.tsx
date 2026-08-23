import * as React from 'react';
import { IconX } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { ChipProps } from './Chip.types';

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant = 'neutral',
      size = 'm',
      checked = false,
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

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = e => {
      onPress?.(e);
    };

    return (
      <span
        data-helix-part="chip-shell"
        data-dismissible={isDismissible ? 'true' : undefined}
        className={cn(className)}
      >
        <button
          ref={ref}
          type="button"
          data-helix-part="chip"
          data-dismissible={isDismissible ? 'true' : undefined}
          data-variant={variant}
          data-size={size}
          data-checked={checked ? 'true' : undefined}
          data-disabled={disabled ? 'true' : undefined}
          aria-pressed={checked}
          disabled={disabled}
          onClick={handleClick}
          {...props}
        >
          {icon && (
            <span data-helix-part="chip-icon">
              <Icon icon={icon} size={14} stroke={1.5} />
            </span>
          )}

          <span data-helix-part="chip-label">{label}</span>

          {iconEnd && (
            <span data-helix-part="chip-icon-end">
              <Icon icon={iconEnd} size={14} stroke={1.5} />
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
              onDismiss();
            }}
          >
            <Icon icon={IconX} size={12} stroke={1.5} />
          </button>
        )}
      </span>
    );
  },
);

Chip.displayName = 'Chip';

export { Chip };
