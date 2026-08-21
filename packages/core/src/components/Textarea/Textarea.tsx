import { forwardRef, useId, useRef, useState, type ChangeEvent } from 'react';
import type { TextareaProps } from './Textarea.types';

let idCounter = 0;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      description,
      errorMessage,
      invalid = false,
      required = false,
      fullWidth = false,
      hideLabel = false,
      size = 'm',
      rows = 4,
      maxLength,
      resize = 'vertical',
      showCount = false,
      disabled,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const uid         = `helix-textarea-${++idCounter}`;
    const id          = rest.id ?? uid;
    const descId      = description  ? `${id}-desc`  : undefined;
    const errId       = errorMessage ? `${id}-err`   : undefined;
    const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

    const [count, setCount] = useState(
      typeof rest.defaultValue === 'string' ? rest.defaultValue.length : 0,
    );

    function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
      setCount(e.target.value.length);
      onChange?.(e);
    }

    return (
      <div
        data-helix-part="textarea-root"
        data-size={size}
        {...(fullWidth  ? { 'data-full-width': '' } : {})}
        {...(disabled   ? { 'data-disabled':   '' } : {})}
        {...(invalid    ? { 'data-invalid':     '' } : {})}
      >
        <label
          data-helix-part="textarea-label"
          htmlFor={id}
          style={hideLabel ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' } : undefined}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>

        <div
          data-helix-part="textarea-wrapper"
          {...(disabled ? { 'data-disabled': '' } : {})}
          {...(invalid  ? { 'data-invalid':  '' } : {})}
        >
          <textarea
            ref={ref}
            id={id}
            data-helix-part="textarea-field"
            data-size={size}
            data-resize={resize}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedby}
            aria-required={required || undefined}
            onChange={handleChange}
            {...rest}
          />
          {showCount && maxLength && (
            <span data-helix-part="textarea-counter" aria-live="polite">
              {count}/{maxLength}
            </span>
          )}
        </div>

        {description && !errorMessage && (
          <span id={descId} data-helix-part="textarea-description">
            {description}
          </span>
        )}
        {errorMessage && (
          <span id={errId} data-helix-part="textarea-error" role="alert">
            {errorMessage}
          </span>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
