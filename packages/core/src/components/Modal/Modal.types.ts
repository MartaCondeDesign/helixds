import type * as React from 'react';

export interface ModalProps {
  /** The modal's title — rendered visibly and used as its accessible name. */
  label: string;
  /** The modal's body content. */
  children: React.ReactNode;
  /** Whether the modal is open. Always controlled — see ADR-010. */
  expanded: boolean;
  /** Called when the modal should close (close button, Escape, or a backdrop click). Modal never closes itself — set `expanded` to false in response. */
  onDismiss: () => void;
  /** Whether to render the header's close (X) button. Default: true */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop dismisses the modal. Default: true */
  closeOnBackdropClick?: boolean;
  /** Label for the footer's primary (rightmost) action button. Omit to render no footer action buttons. */
  primaryActionLabel?: string;
  /** Handler for the primary action button. */
  onPrimaryAction?: () => void;
  /** Label for the footer's secondary action button, to the primary's left. */
  secondaryActionLabel?: string;
  /** Handler for the secondary action button. */
  onSecondaryAction?: () => void;
  /** Label for a tertiary action button, pinned to the footer's bottom-left corner, separate from the primary/secondary group. */
  tertiaryActionLabel?: string;
  /** Handler for the tertiary action button. */
  onTertiaryAction?: () => void;
  /** Additional className for the root. */
  className?: string;
}
