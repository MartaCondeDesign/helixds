export interface SelectOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label:   string;
  options: SelectOption[];
}

export interface SelectProps {
  label:        string;
  options:      (SelectOption | SelectOptionGroup)[];
  value?:       string;
  defaultValue?: string;
  onChange?:    (value: string) => void;
  placeholder?: string;
  description?: string;
  errorMessage?: string;
  invalid?:     boolean;
  disabled?:    boolean;
  required?:    boolean;
  fullWidth?:   boolean;
  hideLabel?:   boolean;
  id?:          string;
  name?:        string;
  className?:  string;
}
