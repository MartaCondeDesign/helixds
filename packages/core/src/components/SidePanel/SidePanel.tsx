import * as React from 'react';
import { IconX } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { IconButton } from '../IconButton';
import { useDialogTransition } from '../../lib/useDialogTransition';
import type { SidePanelProps } from './SidePanel.types';

let idCounter = 0;

const SidePanel = ({
  label,
  children,
  expanded,
  onDismiss,
  showCloseButton = true,
  closeOnBackdropClick = true,
  placement = 'right',
  className,
}: SidePanelProps) => {
  const titleId = `helix-sidePanel-title-${++idCounter}`;
  const { ref, state } = useDialogTransition(expanded, '--helix-sidePanel-duration-close', onDismiss, closeOnBackdropClick);

  return (
    <dialog
      ref={ref}
      data-helix-part="side-panel-root"
      data-state={state}
      data-placement={placement}
      aria-labelledby={titleId}
      className={cn(className)}
    >
      <div data-helix-part="side-panel-header">
        <h2 data-helix-part="side-panel-title" id={titleId}>{label}</h2>
      </div>
      {showCloseButton && (
        // Wrapped, not passed data-helix-part directly — see Modal.tsx's identical comment: IconButton
        // spreads ...props after its own hardcoded data-helix-part="icon-button", so passing the same
        // prop name here would silently detach every IconButton CSS rule, hover included.
        <span data-helix-part="side-panel-close">
          {/* Largest available IconButton size (40px button / 20px icon) — same flagged limitation as Modal. */}
          <IconButton icon={IconX} label="Close" size="l" variant="ghost" onPress={onDismiss} />
        </span>
      )}
      <div data-helix-part="side-panel-body">{children}</div>
    </dialog>
  );
};

SidePanel.displayName = 'SidePanel';

export { SidePanel };
