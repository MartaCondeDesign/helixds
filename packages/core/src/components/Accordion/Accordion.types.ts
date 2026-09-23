import type * as React from 'react';

export interface AccordionProps {
  /** The header's text label. */
  label: string;
  /** The panel's content. */
  children: React.ReactNode;
  /** Controlled open state. Leave unset for uncontrolled (see `defaultExpanded`). */
  expanded?: boolean;
  /** Initial open state for uncontrolled usage. Default: false */
  defaultExpanded?: boolean;
  /** Fires whenever the disclosure toggles, controlled or not. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Prevents toggling. Default: false */
  disabled?: boolean;
  /** Additional className for the root. */
  className?: string;
}
