import * as React from 'react';

export interface MenuOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

export interface MenuOptionGroup {
  label:   string;
  options: MenuOption[];
}

export interface MenuProps {
  id:          string;
  expanded:    boolean;
  anchorRef:   React.RefObject<HTMLElement | null>;
  options:     (MenuOption | MenuOptionGroup)[];
  value?:      string;
  /** Multi-selection (ADR-019): the listbox gets aria-multiselectable and every value in `values` is
   *  marked selected. `value` is ignored when this is set. */
  multiple?:   boolean;
  /** Selected values when `multiple` is set. */
  values?:     string[];
  activeValue?: string;
  onSelect:    (value: string) => void;
  className?:  string;
}
