export type SwitchSize = 's' | 'm';

export interface SwitchProps {
  label:         string;
  /** Hides the label visually while keeping it announced by screen readers. Default: false */
  hideLabel?:    boolean;
  description?:  string;
  checked?:      boolean;
  defaultChecked?: boolean;
  onChange?:     (checked: boolean) => void;
  disabled?:     boolean;
  size?:         SwitchSize;
  id?:           string;
  name?:         string;
}
