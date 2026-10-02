import { Chip } from '../Chip';
import type { ChipGroupProps } from './ChipGroup.types';

export function ChipGroup({ label, options, size = 's', disabled = false }: ChipGroupProps) {
  // Just the chips side by side — no visible header, no selection. `label` names the group for assistive
  // tech only. Each option is a real Chip, so it inherits Chip's own a11y, sizes and CSS unchanged.
  return (
    <div
      role="group"
      aria-label={label}
      data-helix-part="chip-group"
      {...(disabled ? { 'data-disabled': '' } : {})}
    >
      {options.map(opt => (
        <Chip
          key={opt.value}
          size={size}
          label={opt.label}
          {...(opt.icon ? { icon: opt.icon } : {})}
          disabled={opt.disabled || disabled}
        />
      ))}
    </div>
  );
}

ChipGroup.displayName = 'ChipGroup';
