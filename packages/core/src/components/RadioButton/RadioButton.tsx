import * as React from 'react';
import { cn } from '../../lib/utils';
import type { RadioButtonProps } from './RadioButton.types';

let idCounter = 0;

const RadioButton = ({
  label,
  name: nameProp,
  value,
  checked,
  defaultChecked = false,
  onChange,
  description,
  errorMessage,
  invalid = false,
  disabled = false,
  required = false,
  className,
}: RadioButtonProps) => {
  const uid    = `helix-radio-button-${++idCounter}`;
  const name   = nameProp ?? uid;
  const descId = description  ? `${uid}-desc` : undefined;
  const errId  = errorMessage ? `${uid}-err`  : undefined;
  const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <label
      data-helix-part="radio-item"
      htmlFor={uid}
      className={cn(className)}
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(invalid ? { 'data-invalid': '' } : {})}
    >
      <input
        id={uid}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedby}
        data-helix-part="radio-input"
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      <span data-helix-part="radio-control" aria-hidden="true">
        <span data-helix-part="radio-dot" />
      </span>
      <span data-helix-part="radio-item-content">
        <span data-helix-part="radio-item-label">
          {label}
          {required && <span data-helix-part="radio-item-required" aria-hidden="true">*</span>}
        </span>
        {description && !errorMessage && (
          <span id={descId} data-helix-part="radio-item-description">{description}</span>
        )}
        {errorMessage && (
          <span id={errId} data-helix-part="radio-item-error" role="alert">{errorMessage}</span>
        )}
      </span>
    </label>
  );
};

RadioButton.displayName = 'RadioButton';

export { RadioButton };
