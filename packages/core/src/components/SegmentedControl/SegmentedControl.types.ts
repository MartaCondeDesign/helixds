import type { HelixIconComponent } from '../Icon';

export interface SegmentedControlOption {
  value:     string;
  /** Always required: the visible text — or, with `icon`, the option's accessible name. */
  label:     string;
  /** Makes the option icon-only: the Tabler icon component (not an element), rendered through Icon. */
  icon?:     HelixIconComponent;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  label:        string;
  options:      SegmentedControlOption[];
  value?:       string;
  defaultValue?: string;
  onChange?:    (value: string) => void;
  disabled?:    boolean;
  name?:        string;
  className?:   string;
}
