import * as React from 'react';
import { Chip } from '../Chip';
import type { ChipGroupProps } from './ChipGroup.types';

export function ChipGroup({
  label,
  hideLabel = false,
  options,
  value,
  defaultValue,
  onChange,
  size = 's',
  description,
  disabled = false,
}: ChipGroupProps) {
  const uid    = React.useId();
  const descId = description ? `${uid}-desc` : undefined;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue ?? []);
  const selected = isControlled ? value : internalValue;

  const toggle = (optionValue: string) => {
    const next = selected.includes(optionValue)
      ? selected.filter(v => v !== optionValue)
      : [...selected, optionValue];
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <fieldset
      data-helix-part="chip-group"
      {...(disabled ? { 'data-disabled': '' } : {})}
      aria-describedby={descId}
    >
      <legend data-helix-part="chip-group-legend" {...(hideLabel ? { 'data-hidden': '' } : {})}>
        {label}
      </legend>

      {/* Each option is a real, standalone Chip — a toggle button with aria-pressed — so the group
          inherits Chip's own a11y, sizes and CSS unchanged. */}
      <div data-helix-part="chip-group-options">
        {options.map(opt => (
          <Chip
            key={opt.value}
            size={size}
            label={opt.label}
            {...(opt.icon ? { icon: opt.icon } : {})}
            checked={selected.includes(opt.value)}
            disabled={opt.disabled || disabled}
            onPress={() => toggle(opt.value)}
          />
        ))}
      </div>

      {description && (
        <span id={descId} data-helix-part="chip-group-description">
          {description}
        </span>
      )}
    </fieldset>
  );
}

ChipGroup.displayName = 'ChipGroup';
