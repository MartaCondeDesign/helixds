import type { RadioGroupProps } from './RadioGroup.types';

let idCounter = 0;

export function RadioGroup({
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
}: RadioGroupProps) {
  const uid  = `helix-radio-${++idCounter}`;
  const name = nameProp ?? uid;
  const descId = description  ? `${uid}-desc` : undefined;
  const errId  = errorMessage ? `${uid}-err`  : undefined;
  const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      data-helix-part="radio-group"
      // radiogroup, as the contract states — a bare fieldset is role "group", which doesn't allow the
      // aria-required below.
      role="radiogroup"
      data-orientation={orientation}
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(invalid  ? { 'data-invalid':  '' } : {})}
      aria-describedby={describedby}
      aria-required={required || undefined}
    >
      <legend data-helix-part="radio-legend">
        {label}
        {required && <span data-helix-part="radio-required" aria-hidden="true">*</span>}
      </legend>

      <div data-helix-part="radio-options" data-orientation={orientation}>
        {options.map(opt => {
          const itemId    = `${uid}-${opt.value}`;
          const isChecked = value !== undefined ? value === opt.value : undefined;

          return (
            <label
              key={opt.value}
              data-helix-part="radio-item"
              htmlFor={itemId}
              {...(opt.disabled || disabled ? { 'data-disabled': '' } : {})}
            >
              <input
                id={itemId}
                type="radio"
                name={name}
                value={opt.value}
                checked={isChecked}
                defaultChecked={isChecked === undefined && defaultValue === opt.value ? true : undefined}
                disabled={opt.disabled || disabled}
                required={required}
                aria-invalid={invalid || undefined}
                data-helix-part="radio-input"
                onChange={() => onChange?.(opt.value)}
              />
              <span data-helix-part="radio-control" aria-hidden="true">
                <span data-helix-part="radio-dot" />
              </span>
              <span data-helix-part="radio-item-content">
                <span data-helix-part="radio-item-label">{opt.label}</span>
                {opt.description && (
                  <span data-helix-part="radio-item-description">{opt.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {description && !errorMessage && (
        <span id={descId} data-helix-part="radio-description">
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errId} data-helix-part="radio-error" role="alert">
          {errorMessage}
        </span>
      )}
    </fieldset>
  );
}

RadioGroup.displayName = 'RadioGroup';
