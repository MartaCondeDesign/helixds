import * as React from 'react';
import { Checkbox } from '../Checkbox';
import type { CheckboxGroupProps } from './CheckboxGroup.types';

let idCounter = 0;

export function CheckboxGroup({
  label,
  options,
  value,
  defaultValue,
  onChange,
  orientation = 'vertical',
  description,
  errorMessage,
  invalid = false,
  disabled = false,
  required = false,
  name: nameProp,
}: CheckboxGroupProps) {
  const uid  = `helix-checkbox-group-${++idCounter}`;
  const name = nameProp ?? uid;
  const descId = description  ? `${uid}-desc` : undefined;
  const errId  = errorMessage ? `${uid}-err`  : undefined;
  const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue ?? []);
  const selected = isControlled ? value : internalValue;

  const toggle = (optionValue: string, checked: boolean) => {
    const next = checked ? [...selected, optionValue] : selected.filter(v => v !== optionValue);
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <fieldset
      data-helix-part="checkbox-group"
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(invalid  ? { 'data-invalid':  '' } : {})}
      aria-describedby={describedby}
      aria-required={required || undefined}
    >
      <legend data-helix-part="checkbox-group-legend">
        {label}
        {required && <span aria-hidden="true" style={{ color: 'var(--helix-color-text-danger)', marginLeft: 2 }}>*</span>}
      </legend>

      <div data-helix-part="checkbox-group-options" data-orientation={orientation}>
        {options.map(opt => (
          <Checkbox
            key={opt.value}
            id={`${uid}-${opt.value}`}
            name={name}
            value={opt.value}
            label={opt.label}
            {...(opt.description !== undefined ? { description: opt.description } : {})}
            checked={selected.includes(opt.value)}
            onChange={checked => toggle(opt.value, checked)}
            disabled={opt.disabled || disabled}
            required={required}
            invalid={invalid}
          />
        ))}
      </div>

      {description && !errorMessage && (
        <span id={descId} data-helix-part="checkbox-group-description">
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errId} data-helix-part="checkbox-group-error" role="alert">
          {errorMessage}
        </span>
      )}
    </fieldset>
  );
}

CheckboxGroup.displayName = 'CheckboxGroup';
