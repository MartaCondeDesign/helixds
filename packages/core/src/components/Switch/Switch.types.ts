export type SwitchSize = 's' | 'm';

export interface SwitchProps {
  label:         string;
  description?:  string;
  checked?:      boolean;
  defaultChecked?: boolean;
  onChange?:     (checked: boolean) => void;
  disabled?:     boolean;
  size?:         SwitchSize;
  id?:           string;
  name?:         string;
}
