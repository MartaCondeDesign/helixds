import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { InputProps } from './Input.types';

let idCounter = 0;

// Form fields ship one size, m (owner's decision 2026-10-21 — Input, Select, MultiSelect and Textarea share
// one size set): its icons are 16px, like Select's chevron in the same row.
const FIELD_ICON_SIZE = 16;

// isLoading: the same spinner Button and IconButton draw, at the field's icon size, where iconEnd sits
// (owner's decision 2026-10-20 — before it the field only locked silently).
const Spinner = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hideLabel  = false,
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
    const descId  = description && !invalid ? `${uid}-desc`  : undefined;
    const errorId = invalid && errorMessage ? `${uid}-error` : undefined;
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
        data-disabled={disabled ? 'true' : undefined}
        className={cn(className)}
      >
        <label
          data-helix-part="input-label"
          htmlFor={uid}
          style={hideLabel ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' } : undefined}
        >
          {label}
          {props.required && <span data-helix-part="input-required" aria-hidden="true"> *</span>}
        </label>

        <div
          ref={wrapperRef}
          data-helix-part="input-wrapper"
          data-invalid={invalid ? 'true' : undefined}
          data-disabled={disabled ? 'true' : undefined}
          data-loading={isLoading ? 'true' : undefined}
          onAnimationEnd={() => wrapperRef.current?.removeAttribute('data-shaking')}
        >
          {icon && (
            <span data-helix-part="input-icon">
              <Icon icon={icon} size={FIELD_ICON_SIZE} />
            </span>
          )}

          <input
            ref={ref}
            id={uid}
            data-helix-part="input-field"
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

          {isLoading ? (
            <span data-helix-part="input-spinner">
              <Spinner size={FIELD_ICON_SIZE} />
            </span>
          ) : iconEnd && (
            <span data-helix-part="input-icon-end">
              <Icon icon={iconEnd} size={FIELD_ICON_SIZE} />
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
