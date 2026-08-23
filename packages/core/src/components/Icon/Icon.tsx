import * as React from 'react';
import { cn } from '../../lib/utils';
import type { IconProps } from './Icon.types';

const Icon = ({
  icon: IconComponent,
  size = 16,
  stroke = 1.5,
  color = 'currentColor',
  label,
  decorative = true,
  className,
}: IconProps) => {
  const isMeaningful = !decorative && !!label;

  // icon-vector (the inner <path>) is generated inside the Tabler component and isn't
  // reachable as a prop target — only icon-root carries a data-helix-part.
  return (
    <IconComponent
      data-helix-part="icon-root"
      size={size}
      stroke={stroke}
      color={color}
      className={cn(className)}
      aria-hidden={isMeaningful ? undefined : true}
      role={isMeaningful ? 'img' : undefined}
      aria-label={isMeaningful ? label : undefined}
    />
  );
};

Icon.displayName = 'Icon';

export { Icon };
