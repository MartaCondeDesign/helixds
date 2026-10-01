import type { HelixIconComponent } from '../Icon';
import type { ChipSize } from '../Chip';

export interface ChipGroupOption {
  value:     string;
  label:     string;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconFilter). */
  icon?:     HelixIconComponent;
  disabled?: boolean;
}

export interface ChipGroupProps {
  /** Accessible group label, rendered as the fieldset's legend. */
  label:         string;
  /** Hides the legend visually but keeps it for screen readers. */
  hideLabel?:    boolean;
  /** The filters. */
  options:       ChipGroupOption[];
  /** Controlled selected values. */
  value?:        string[];
  /** Uncontrolled initial values. */
  defaultValue?: string[];
  /** Receives the full updated set of selected values. */
  onChange?:     (values: string[]) => void;
  /** Size of every chip in the group. Default: 's' */
  size?:         ChipSize;
  /** Helper text shown below the group. */
  description?:  string;
  /** Disables every chip in the group. */
  disabled?:     boolean;
}
