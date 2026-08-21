export interface CheckboxProps {
  label:         string;
  description?:  string;
  errorMessage?: string;
  checked?:      boolean;
  defaultChecked?: boolean;
  onChange?:     (checked: boolean) => void;
  disabled?:     boolean;
  required?:     boolean;
  invalid?:      boolean;
  indeterminate?: boolean;
  id?:           string;
  name?:         string;
  value?:        string;
}
