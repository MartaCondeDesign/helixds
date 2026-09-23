import * as React from 'react';
import { IconX } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { useDialogTransition } from '../../lib/useDialogTransition';
import type { ModalProps } from './Modal.types';

let idCounter = 0;

const Modal = ({
  label,
  children,
  expanded,
  onDismiss,
  showCloseButton = true,
  closeOnBackdropClick = true,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  tertiaryActionLabel,
  onTertiaryAction,
  className,
}: ModalProps) => {
  const titleId = `helix-modal-title-${++idCounter}`;
  const { ref, state } = useDialogTransition(expanded, '--helix-modal-duration-close', onDismiss, closeOnBackdropClick);
  const hasFooter = !!primaryActionLabel || !!secondaryActionLabel || !!tertiaryActionLabel;

  if (process.env.NODE_ENV !== 'production' && !showCloseButton && !hasFooter) {
    // eslint-disable-next-line no-console
    console.warn(
      'Modal: showCloseButton is false and no footer action (primaryActionLabel/secondaryActionLabel/tertiaryActionLabel) was given — this modal has no visible way to dismiss it (Escape and closeOnBackdropClick still work, if enabled, but there is no on-screen affordance). Add at least one footer action or re-enable showCloseButton.',
    );
  }

  return (
    <dialog
      ref={ref}
      data-helix-part="modal-root"
      data-state={state}
      aria-labelledby={titleId}
      className={cn(className)}
    >
      <div data-helix-part="modal-header">
        <h2 data-helix-part="modal-title" id={titleId}>{label}</h2>
      </div>
      {showCloseButton && (
        // Wrapped, not passed data-helix-part directly: IconButton spreads ...props AFTER its own
        // hardcoded data-helix-part="icon-button" (see IconButton.tsx), so a same-named prop here
        // would silently overwrite it and detach every IconButton CSS rule — hover included — since
        // they're all keyed off that exact attribute. The wrapper span carries the positioning
        // instead, leaving IconButton's own anatomy attribute intact.
        <span data-helix-part="modal-close">
          {/* Largest available IconButton size (40px button / 20px icon) — there's no IconButton
              size that reaches a 32px icon today; see the conversation this shipped from. */}
          <IconButton icon={IconX} label="Close" size="l" variant="ghost" onPress={onDismiss} />
        </span>
      )}
      <div data-helix-part="modal-body">{children}</div>
      {hasFooter && (
        <div data-helix-part="modal-footer">
          <div data-helix-part="modal-footer-start">
            {tertiaryActionLabel && (
              // "Tertiary" maps to Button's `ghost` variant — Helix's Button has no separate
              // `tertiary` variant token today.
              <Button variant="ghost" onPress={() => onTertiaryAction?.()}>{tertiaryActionLabel}</Button>
            )}
          </div>
          <div data-helix-part="modal-footer-end">
            {secondaryActionLabel && (
              <Button variant="secondary" onPress={() => onSecondaryAction?.()}>{secondaryActionLabel}</Button>
            )}
            {primaryActionLabel && (
              <Button variant="primary" onPress={() => onPrimaryAction?.()}>{primaryActionLabel}</Button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
};

Modal.displayName = 'Modal';

export { Modal };
