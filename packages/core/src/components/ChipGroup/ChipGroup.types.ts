import type { HelixIconComponent } from '../Icon';
import type { ChipSize } from '../Chip';

export interface ChipGroupOption {
  /** Stable key for the chip. */
  value:     string;
  label:     string;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconFilter). */
  icon?:     HelixIconComponent;
  disabled?: boolean;
}

export interface ChipGroupProps {
  /** Accessible name of the group (aria-label) — never rendered visibly. */
  label:     string;
  /** The chips. */
  options:   ChipGroupOption[];
  /** Size of every chip in the group. Default: 's' */
  size?:     ChipSize;
  /** Disables every chip in the group. */
  disabled?: boolean;
}
