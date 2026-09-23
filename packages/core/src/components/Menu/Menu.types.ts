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
  activeValue?: string;
  onSelect:    (value: string) => void;
  className?:  string;
}
