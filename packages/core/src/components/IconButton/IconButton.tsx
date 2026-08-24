import * as React from 'react';
import { cn } from '../../lib/utils';
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
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
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
        {...props}
      >
        {loading ? <Spinner /> : <Icon icon={icon} size={ICON_SIZE_BY_BUTTON_SIZE[size]} />}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';

export { IconButton };
