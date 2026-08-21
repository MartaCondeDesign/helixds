import { IconChevronDown } from '@tabler/icons-react';
import type { SelectProps, SelectOption, SelectOptionGroup } from './Select.types';

let idCounter = 0;

function isGroup(opt: SelectOption | SelectOptionGroup): opt is SelectOptionGroup {
  return 'options' in opt;
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  description,
  errorMessage,
  invalid = false,
  disabled = false,
  required = false,
  fullWidth = false,
  hideLabel = false,
  size = 'm',
  id: idProp,
  name,
}: SelectProps) {
  const uid        = `helix-select-${++idCounter}`;
  const id         = idProp ?? uid;
  const descId     = description  ? `${id}-desc` : undefined;
  const errId      = errorMessage ? `${id}-err`  : undefined;
  const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <div
      data-helix-part="select-root"
      {...(fullWidth ? { 'data-full-width': '' } : {})}
      {...(disabled  ? { 'data-disabled':   '' } : {})}
      {...(invalid   ? { 'data-invalid':    '' } : {})}
    >
      <label
        data-helix-part="select-label"
        htmlFor={id}
        style={hideLabel ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' } : undefined}
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      <div
        data-helix-part="select-wrapper"
        data-size={size}
        {...(disabled ? { 'data-disabled': '' } : {})}
        {...(invalid  ? { 'data-invalid':  '' } : {})}
      >
        <select
          id={id}
          name={name}
          data-helix-part="select-trigger"
          data-size={size}
          defaultValue={defaultValue}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          aria-required={required || undefined}
          onChange={e => onChange?.(e.target.value)}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map(opt =>
            isGroup(opt) ? (
              <optgroup key={opt.label} label={opt.label}>
                {opt.options.map(o => (
                  <option key={o.value} value={o.value} disabled={o.disabled}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ),
          )}
        </select>

        <span data-helix-part="select-chevron" aria-hidden="true">
          <IconChevronDown size={14} />
        </span>
      </div>

      {description && !errorMessage && (
        <span id={descId} data-helix-part="select-description">
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errId} data-helix-part="select-error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

Select.displayName = 'Select';
