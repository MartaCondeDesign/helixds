export interface RadioButtonProps {
  /** Visible label. */
  label: string;
  /** Native radio group name, shared with any sibling RadioButtons it should be mutually exclusive with. Auto-generated (unique to this instance) if omitted — meaning it won't group with anything unless set explicitly. */
  name?: string;
  /** Native radio value, read from the form on submit. Defaults to the native 'on' if omitted. */
  value?: string;
  /** Controlled checked state. */
  checked?: boolean;
  /** Uncontrolled initial checked state. Default: false */
  defaultChecked?: boolean;
  /** Change handler. */
  onChange?: (checked: boolean) => void;
  /** Helper text shown under the label. Not shown when `errorMessage` is also set. */
  description?: string;
  /** Error text shown under the label when `invalid` is true — takes over from `description`. */
  errorMessage?: string;
  /** Shows error styling. Default: false */
  invalid?: boolean;
  /** Disables the input. Default: false */
  disabled?: boolean;
  /** Marks the input as required. Default: false */
  required?: boolean;
  /** Additional className for the root. */
  className?: string;
}
