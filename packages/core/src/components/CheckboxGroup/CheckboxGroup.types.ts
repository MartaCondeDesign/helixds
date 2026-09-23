export interface CheckboxOption {
  value:        string;
  label:        string;
  description?: string;
  disabled?:    boolean;
}

export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

export interface CheckboxGroupProps {
  label:        string;
  options:      CheckboxOption[];
  value?:       string[];
  defaultValue?: string[];
  onChange?:    (values: string[]) => void;
  orientation?: CheckboxGroupOrientation;
  description?: string;
  errorMessage?: string;
  invalid?:     boolean;
  disabled?:    boolean;
  required?:    boolean;
  name?:        string;
}
