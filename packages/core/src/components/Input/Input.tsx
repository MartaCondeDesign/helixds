import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { InputProps } from './Input.types';

let idCounter = 0;

// Form-field icons never go below 16px — s shares m's 16 so a small field's icon stays legible and
// matches Select's chevron (also 16) in the same row.
const ICON_SIZE_BY_FIELD_SIZE = { s: 16, m: 16, l: 18 } as const;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hideLabel  = false,
      size       = 'm',
      invalid    = false,
      isLoading    = false,
      fullWidth  = false,
      icon,
      iconEnd,
      description,
      errorMessage,
      invalidAttempt,
      id,
      disabled,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const [uid] = React.useState(() => id ?? `helix-input-${++idCounter}`);
    const descId  = description  ? `${uid}-desc`  : undefined;
    const errorId = errorMessage ? `${uid}-error` : undefined;
    const describedBy = [descId, errorId].filter(Boolean).join(' ') || undefined;

    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const prevShakeSignal = React.useRef({ invalid, invalidAttempt });

    React.useEffect(() => {
      const prev = prevShakeSignal.current;
      // Shake on a false->true edge, OR on `invalidAttempt` changing while already
      // invalid — the edge alone misses a consumer that sets invalid(false) then
      // invalid(true) synchronously in one handler (React 18 batches that to a
      // no-op re-render when it was already true), which is the common "resubmit
      // while still invalid" shape.
      const becameInvalid  = invalid && !prev.invalid;
      const retriedInvalid = invalid && invalidAttempt !== undefined && invalidAttempt !== prev.invalidAttempt;
      if (becameInvalid || retriedInvalid) {
        const el = wrapperRef.current;
        if (el) {
          // Remove-reflow-reapply so the shake restarts even on a repeat trigger.
          el.removeAttribute('data-shaking');
          void el.offsetWidth;
          el.setAttribute('data-shaking', 'true');
        }
      }
      prevShakeSignal.current = { invalid, invalidAttempt };
    }, [invalid, invalidAttempt]);

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
          ref={wrapperRef}
          data-helix-part="input-wrapper"
          data-size={size}
          data-invalid={invalid ? 'true' : undefined}
          data-disabled={disabled ? 'true' : undefined}
          data-loading={isLoading ? 'true' : undefined}
          onAnimationEnd={() => wrapperRef.current?.removeAttribute('data-shaking')}
        >
          {icon && (
            <span data-helix-part="input-icon">
              <Icon icon={icon} size={ICON_SIZE_BY_FIELD_SIZE[size]} />
            </span>
          )}

          <input
            ref={ref}
            id={uid}
            data-helix-part="input-field"
            data-size={size}
            disabled={disabled || isLoading}
            aria-invalid={invalid ? 'true' : undefined}
            aria-required={props.required ? 'true' : undefined}
            aria-busy={isLoading ? 'true' : undefined}
            aria-describedby={describedBy}
            {...props}
            onKeyDown={e => {
              onKeyDown?.(e);
              // Contract a11y.keyboardNav: Escape blurs the field (unless the consumer handled it).
              if (e.key === 'Escape' && !e.defaultPrevented) e.currentTarget.blur();
            }}
          />

          {iconEnd && (
            <span data-helix-part="input-icon-end">
              <Icon icon={iconEnd} size={ICON_SIZE_BY_FIELD_SIZE[size]} />
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
