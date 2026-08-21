import * as React from 'react';
import { cn } from '../../lib/utils';
import type { InputProps } from './Input.types';

let idCounter = 0;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hideLabel  = false,
      size       = 'm',
      invalid    = false,
      loading    = false,
      fullWidth  = false,
      icon,
      iconEnd,
      description,
      errorMessage,
      id,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const [uid] = React.useState(() => id ?? `helix-input-${++idCounter}`);
    const descId  = description  ? `${uid}-desc`  : undefined;
    const errorId = errorMessage ? `${uid}-error` : undefined;
    const describedBy = [descId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div
        data-helix-part="input-root"
        data-full-width={fullWidth ? 'true' : undefined}
        className={cn(className)}
      >
        <label
          data-helix-part="input-label"
          htmlFor={uid}
          style={hideLabel ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' } : undefined}
        >
          {label}
          {props.required && <span aria-hidden="true"> *</span>}
        </label>

        <div
          data-helix-part="input-wrapper"
          data-invalid={invalid ? 'true' : undefined}
          data-disabled={disabled ? 'true' : undefined}
          data-loading={loading ? 'true' : undefined}
        >
          {icon && (
            <span data-helix-part="input-icon" aria-hidden="true">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={uid}
            data-helix-part="input-field"
            data-size={size}
            disabled={disabled || loading}
            aria-invalid={invalid ? 'true' : undefined}
            aria-busy={loading ? 'true' : undefined}
            aria-describedby={describedBy}
            {...props}
          />

          {iconEnd && (
            <span data-helix-part="input-icon-end">
              {iconEnd}
            </span>
          )}
        </div>

        {description && !invalid && (
          <p id={descId} data-helix-part="input-description">
            {description}
          </p>
        )}

        {invalid && errorMessage && (
          <p id={errorId} data-helix-part="input-error" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
