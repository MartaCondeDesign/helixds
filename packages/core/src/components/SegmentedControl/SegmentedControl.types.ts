export interface SegmentedControlOption {
  value:     string;
  label:     string;
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
