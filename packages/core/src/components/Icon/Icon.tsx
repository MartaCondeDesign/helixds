import * as React from 'react';
import { cn } from '../../lib/utils';
import type { IconProps, IconSize } from './Icon.types';

// Tabler's SVG keeps viewBox="0 0 24 24" fixed no matter what `size` renders at, so a flat
// stroke-width shrinks in real screen pixels as size drops — mathematically proportional, but
// perceptibly weak once rendered small. This table compensates: thicker than strict proportion
// below the 24px reference (where stroke stays 1.5, unchanged), flat above it.
const STROKE_BY_SIZE: Record<IconSize, number> = {
  12: 2,
  14: 1.9,
  16: 1.75,
  18: 1.65,
  20: 1.6,
  24: 1.5,
  32: 1.5,
};

const Icon = ({
  icon: IconComponent,
  size = 16,
  stroke,
  color = 'currentColor',
  label,
  decorative = true,
  className,
}: IconProps) => {
  const isMeaningful = !decorative && !!label;
  const resolvedStroke = stroke ?? STROKE_BY_SIZE[size];

  // icon-vector (the inner <path>) is generated inside the Tabler component and isn't
  // reachable as a prop target — only icon-root carries a data-helix-part.
  return (
    <IconComponent
      data-helix-part="icon-root"
      size={size}
      stroke={resolvedStroke}
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
