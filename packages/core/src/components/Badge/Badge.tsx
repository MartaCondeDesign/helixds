import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { BadgeProps } from './Badge.types';

const Badge = ({ variant = 'neutral', size = 's', label, icon, className }: BadgeProps) => {
  return (
      <span
        data-helix-part="badge"
        data-variant={variant}
        data-size={size}
        className={cn(className)}
      >
      {icon && (
        <span data-helix-part="badge-icon">
          <Icon icon={icon} size={12} />
        </span>
      )}
      <span data-helix-part="badge-label">{label}</span>
    </span>
  );
};

Badge.displayName = 'Badge';

export { Badge };
