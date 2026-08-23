import * as React from 'react';
import { cn } from '../../lib/utils';
import type { CardProps } from './Card.types';

const Card = ({ header, children, padding = 'default', className }: CardProps) => {
  return (
    <div data-helix-part="card-root" data-padding={padding} className={cn(className)}>
      {header && <div data-helix-part="card-header">{header}</div>}
      <div data-helix-part="card-body">{children}</div>
    </div>
  );
};

Card.displayName = 'Card';

export { Card };
