import * as React from 'react';
import {
  IconInfoCircle,
  IconCircleCheck,
  IconAlertTriangle,
  IconAlertHexagon,
} from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { HelixIconComponent } from '../Icon';
import type { BadgeProps, BadgeVariant } from './Badge.types';

// The canonical icon shape per variant, matching Toast's own ICON_BY_VARIANT one-for-one — same
// shape family (info-circle / circle-check / alert-triangle / alert-hexagon), Outline build instead
// of Toast's Filled build. Badge's `icon` prop stays fully opt-in (nothing renders unless a caller
// passes one) — this is a convenience mapping for callers who want the matching shape, not an
// automatic default, so no existing Badge usage changes visually just by this existing.
export const BADGE_ICON_BY_VARIANT: Record<BadgeVariant, HelixIconComponent> = {
  neutral: IconInfoCircle,
  info: IconInfoCircle,
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  danger: IconAlertHexagon,
};

const Badge = ({ variant = 'neutral', size = 's', label, icon, className }: BadgeProps) => {
  return (
      <span
        data-helix-part="badge"
        data-variant={variant}
        data-size={size}
        className={cn(className)}
      >
      {/* badge-content carries 2px of the side padding (spacing-3xs) so the total — 6px xs / 10px s — is
          built from scale tokens only (4+2, 8+2), never an off-scale literal. */}
      <span data-helix-part="badge-content">
        {icon && (
          <span data-helix-part="badge-icon">
            <Icon icon={icon} size={12} />
          </span>
        )}
        <span data-helix-part="badge-label">{label}</span>
      </span>
    </span>
  );
};

Badge.displayName = 'Badge';

export { Badge };
