export type RadioOrientation = 'vertical' | 'horizontal';

export interface RadioOption {
  value:        string;
  label:        string;
  description?: string;
  disabled?:    boolean;
}

export interface RadioGroupProps {
  label:        string;
  options:      RadioOption[];
  value?:       string;
  defaultValue?: string;
  onChange?:    (value: string) => void;
  orientation?: RadioOrientation;
  description?: string;
  errorMessage?: string;
  invalid?:     boolean;
  disabled?:    boolean;
  required?:    boolean;
  name?:        string;
}
