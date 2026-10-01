export interface MultiSelectOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

export interface MultiSelectOptionGroup {
  label:   string;
  options: MultiSelectOption[];
}

export interface MultiSelectProps {
  /** Visible or screen-reader-only label. Required for a11y. */
  label: string;
  /** List of options and grouped options. */
  options: (MultiSelectOption | MultiSelectOptionGroup)[];
  /** Controlled selected values. */
  value?: string[];
  /** Uncontrolled initial values. */
  defaultValue?: string[];
  /** Fires with the full new array whenever a value is added or removed. */
  onChange?: (values: string[]) => void;
  /** Prompt shown while nothing is selected. */
  placeholder?: string;
  /** Helper text shown below the field. */
  description?: string;
  /** Error text shown when invalid=true. */
  errorMessage?: string;
  /** Shows error styling and message. */
  invalid?: boolean;
  /** Non-interactive state. */
  disabled?: boolean;
  /** At least one value required; blocks native form submit while empty, like Select. */
  required?: boolean;
  /** Expands to container width. */
  fullWidth?: boolean;
  /** Hides the label visually but keeps it accessible. */
  hideLabel?: boolean;
  /** Optional field id override (the combobox's id). */
  id?: string;
  /** Native form field name; the submitted value is the selected values joined by commas. */
  name?: string;
  /** Additional className for the root. */
  className?: string;
}
