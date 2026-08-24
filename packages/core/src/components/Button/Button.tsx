import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { ButtonProps } from './Button.types';

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
      loading   = false,
      icon,
      iconEnd,
      fullWidth = false,
      className,
      disabled,
      children,
      onPress,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        data-helix-part="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading ? 'true' : undefined}
        data-full-width={fullWidth ? 'true' : undefined}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        className={cn(className)}
        onClick={onPress}
        {...props}
      >
        {loading ? (
          <Spinner />
        ) : icon ? (
          <span data-helix-part="button-icon">
            <Icon icon={icon} size={16} />
          </span>
        ) : null}

        {children && (
          <span data-helix-part="button-label">{children}</span>
        )}

        {!loading && iconEnd && (
          <span data-helix-part="button-icon-end">
            <Icon icon={iconEnd} size={16} />
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
