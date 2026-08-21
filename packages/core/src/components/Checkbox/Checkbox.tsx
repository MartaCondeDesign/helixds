import { useEffect, useRef } from 'react';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import type { CheckboxProps } from './Checkbox.types';

let idCounter = 0;

export function Checkbox({
  label,
  description,
  errorMessage,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  required = false,
  invalid = false,
  indeterminate = false,
  id: idProp,
  name,
  value,
}: CheckboxProps) {
  const uid    = `helix-checkbox-${++idCounter}`;
  const id     = idProp ?? uid;
  const inputRef = useRef<HTMLInputElement>(null);
  const descId   = description  ? `${id}-desc` : undefined;
  const errId    = errorMessage ? `${id}-err`  : undefined;
  const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div
      data-helix-part="checkbox-root"
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(invalid  ? { 'data-invalid':  '' } : {})}
    >
      <label data-helix-part="checkbox-label" htmlFor={id}>
        {/* sr-only native input */}
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          data-helix-part="checkbox-input"
          onChange={e => onChange?.(e.target.checked)}
        />

        {/* custom visual control — styled via CSS sibling selector */}
        <span data-helix-part="checkbox-control" aria-hidden="true">
          <span data-helix-part="checkbox-indicator">
            {indeterminate
              ? <IconMinus size={10} strokeWidth={3} />
              : <IconCheck size={10} strokeWidth={3} />
            }
          </span>
        </span>

        <span data-helix-part="checkbox-text">
          {label}
          {required && <span aria-hidden="true" style={{ color: 'var(--helix-color-text-danger)', marginLeft: 2 }}>*</span>}
        </span>
      </label>

      {description && !errorMessage && (
        <span id={descId} data-helix-part="checkbox-description">
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errId} data-helix-part="checkbox-error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

Checkbox.displayName = 'Checkbox';
